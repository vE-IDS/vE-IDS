// Package facility syncs VATUSA facilities and staff into the database.
//
// It fetches the VATUSA facility list (which embeds each ARTCC's ATM/DATM/TA/FE
// CIDs) plus every facility's roster (the only source of the FACCBT role), and
// reconciles them into `facilities` + `user_facility_roles`. This runs on boot
// and every VatusaSyncInterval (default 2h) — the persisted grants are the
// "cache", so access checks read the DB and never hit VATUSA per request.
package facility

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strconv"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"veids/api/internal/db/seed"
	"veids/api/internal/db/sqlc"
	"veids/api/internal/vatusa"
)

// source label for grants this syncer owns; only these are reconciled, leaving
// manual grants (source='manual') untouched.
const sourceVATUSA = "vatusa"

// rosterConcurrency bounds simultaneous per-facility roster fetches.
const rosterConcurrency = 8

// vatusaRoleToKey maps VATUSA staff-position strings to seeded role keys. Only
// these positions grant access; EC/WM/INS/MTR are intentionally excluded per the
// access policy (they are still displayed via the facility metadata).
var vatusaRoleToKey = map[string]string{
	"ATM":    seed.RoleATM,
	"DATM":   seed.RoleDATM,
	"TA":     seed.RoleTA,
	"FE":     seed.RoleFE,
	"FACCBT": seed.RoleFACCBT,
}

// Syncer periodically syncs VATUSA data into the database.
type Syncer struct {
	client   *vatusa.Client
	pool     *pgxpool.Pool
	queries  *sqlc.Queries
	interval time.Duration
	logger   *slog.Logger
}

// NewSyncer constructs a Syncer.
func NewSyncer(client *vatusa.Client, pool *pgxpool.Pool, queries *sqlc.Queries, interval time.Duration, logger *slog.Logger) *Syncer {
	return &Syncer{client: client, pool: pool, queries: queries, interval: interval, logger: logger}
}

// Run syncs immediately, then every interval, until ctx is cancelled. Sync
// failures are logged and non-fatal (stale data keeps serving).
func (s *Syncer) Run(ctx context.Context) {
	s.SyncOnce(ctx)
	t := time.NewTicker(s.interval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			s.SyncOnce(ctx)
		}
	}
}

type grant struct {
	cid      int64
	facility string
	role     string
}

// SyncOnce performs one full VATUSA sync.
func (s *Syncer) SyncOnce(ctx context.Context) {
	facs, err := s.client.FetchFacilities(ctx)
	if err != nil {
		s.logger.Warn("vatusa: fetch facilities failed", "err", err)
		return
	}

	// 1) Upsert each facility. Staff CIDs go into the extensible metadata bag.
	for _, f := range facs {
		meta, _ := json.Marshal(map[string]any{
			"staff": map[string]int64{
				"atm": f.Staff.ATM, "datm": f.Staff.DATM, "ta": f.Staff.TA,
				"fe": f.Staff.FE, "ec": f.Staff.EC, "wm": f.Staff.WM,
			},
		})
		if err := s.queries.UpsertFacility(ctx, sqlc.UpsertFacilityParams{
			ID: f.ID, Name: f.Name, Url: f.URL, Region: int32(f.Region), Active: f.Active, Metadata: meta,
		}); err != nil {
			s.logger.Warn("vatusa: upsert facility failed", "facility", f.ID, "err", err)
		}
	}

	// 2) Collect grants. Admin CIDs come from the list; FACCBT (and admin roles,
	// for robustness) come from each roster. Deduplicated into a set.
	grants := map[string]grant{}
	add := func(cid int64, facilityID, roleKey string) {
		if cid <= 0 || roleKey == "" {
			return
		}
		grants[fmt.Sprintf("%d|%s|%s", cid, facilityID, roleKey)] = grant{cid, facilityID, roleKey}
	}
	for _, f := range facs {
		add(f.Staff.ATM, f.ID, seed.RoleATM)
		add(f.Staff.DATM, f.ID, seed.RoleDATM)
		add(f.Staff.TA, f.ID, seed.RoleTA)
		add(f.Staff.FE, f.ID, seed.RoleFE)
	}

	// Fetch rosters concurrently, then merge single-threaded via add().
	var mu sync.Mutex
	var wg sync.WaitGroup
	var rosterGrants []grant
	sem := make(chan struct{}, rosterConcurrency)
	for _, f := range facs {
		f := f
		wg.Add(1)
		sem <- struct{}{}
		go func() {
			defer wg.Done()
			defer func() { <-sem }()
			roles, err := s.client.FetchFacilityRoles(ctx, f.ID)
			if err != nil {
				s.logger.Warn("vatusa: roster fetch failed", "facility", f.ID, "err", err)
				return
			}
			local := make([]grant, 0, len(roles))
			for _, r := range roles {
				if key, ok := vatusaRoleToKey[r.Role]; ok {
					local = append(local, grant{cid: r.CID, facility: f.ID, role: key})
				}
			}
			mu.Lock()
			rosterGrants = append(rosterGrants, local...)
			mu.Unlock()
		}()
	}
	wg.Wait()
	for _, g := range rosterGrants {
		add(g.cid, g.facility, g.role)
	}

	// 3) Reconcile: in one transaction, wipe the VATUSA-sourced grants and
	// reinsert the fresh set. Manual grants are left in place.
	if err := s.reconcile(ctx, grants); err != nil {
		s.logger.Warn("vatusa: reconcile grants failed", "err", err)
		return
	}
	s.logger.Info("vatusa sync complete", "facilities", len(facs), "grants", len(grants))
}

func (s *Syncer) reconcile(ctx context.Context, grants map[string]grant) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck // rollback after commit is a no-op

	q := s.queries.WithTx(tx)
	if err := q.DeleteGrantsBySource(ctx, sourceVATUSA); err != nil {
		return err
	}
	for _, g := range grants {
		if err := q.InsertGrant(ctx, sqlc.InsertGrantParams{
			Cid:        strconv.FormatInt(g.cid, 10),
			FacilityID: pgtype.Text{String: g.facility, Valid: true},
			RoleKey:    g.role,
			Source:     sourceVATUSA,
		}); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
