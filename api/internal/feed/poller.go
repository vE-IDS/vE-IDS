package feed

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"veids/api/internal/atis"
	"veids/api/internal/db/sqlc"
	"veids/api/internal/vatsim"
	"veids/api/internal/vnas"
)

// metarTTL bounds how often a single airport's METAR is re-fetched.
const metarTTL = 60 * time.Second

type metarEntry struct {
	text string
	at   time.Time
}

// Poller is the single background loop that polls the VATSIM datafeed, projects
// and broadcasts it, and detects + broadcasts ATIS changes.
type Poller struct {
	client   *vatsim.Client
	vnas     *vnas.Client
	store    *Store
	hub      *Hub
	queries  *sqlc.Queries
	interval time.Duration
	logger   *slog.Logger

	lastTimestamp string

	// lastControllers is the previous controller set keyed by position id, used
	// to diff each tick. Poller-local (controllers aren't persisted or seeded).
	lastControllersTS string
	lastControllers   map[string]ControllerConnection

	metarMu    sync.Mutex
	metarCache map[string]metarEntry
}

// NewPoller constructs a Poller.
func NewPoller(client *vatsim.Client, vnasClient *vnas.Client, store *Store, hub *Hub, queries *sqlc.Queries, interval time.Duration, logger *slog.Logger) *Poller {
	return &Poller{
		client:          client,
		vnas:            vnasClient,
		store:           store,
		hub:             hub,
		queries:         queries,
		interval:        interval,
		logger:          logger,
		lastControllers: map[string]ControllerConnection{},
		metarCache:      map[string]metarEntry{},
	}
}

// SeedFromDB loads persisted ATIS state so a restart doesn't re-broadcast every
// station on the first tick.
func (p *Poller) SeedFromDB(ctx context.Context) {
	rows, err := p.queries.ListAtisState(ctx)
	if err != nil {
		p.logger.Warn("seed atis_state failed", "err", err)
		return
	}
	reports := make([]atis.Report, 0, len(rows))
	for _, r := range rows {
		var rep atis.Report
		if err := json.Unmarshal(r.RawReport, &rep); err != nil {
			continue
		}
		reports = append(reports, rep)
	}
	p.store.Seed(reports)
	p.logger.Info("seeded atis state", "stations", len(reports))
}

// Run polls immediately, then every interval, until ctx is cancelled.
func (p *Poller) Run(ctx context.Context) {
	p.tick(ctx)
	t := time.NewTicker(p.interval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			p.tick(ctx)
		}
	}
}

func (p *Poller) tick(ctx context.Context) {
	// Controllers come from a separate upstream (vNAS) with its own change gate,
	// so run it first — independent of whether the VATSIM datafeed changed below.
	p.tickControllers(ctx)

	feed, err := p.client.FetchDatafeed(ctx)
	if err != nil {
		p.logger.Warn("datafeed fetch failed", "err", err)
		return
	}
	if ts := feed.General.UpdateTimestamp; ts != "" && ts == p.lastTimestamp {
		return // nothing changed upstream
	}
	p.lastTimestamp = feed.General.UpdateTimestamp

	// Datafeed projection + broadcast.
	proj := projectDatafeed(feed)
	p.store.SetDatafeed(proj)
	p.broadcast(MsgDatafeed, proj)

	// ATIS: fetch METARs for online stations, build reports, detect changes.
	stations := atis.Stations(feed)
	metarByICAO := p.fetchMetars(ctx, stations)
	reports := atis.Build(feed, metarByICAO)
	p.store.SetAtis(reports)

	var changed []atis.Report
	for _, r := range reports {
		if r.AtisLetter != p.store.LastLetter(r.ICAO) {
			changed = append(changed, r)
			p.store.SetLastLetter(r.ICAO, r.AtisLetter)
			p.persistAtis(ctx, r)
		}
	}
	if len(changed) > 0 {
		p.logger.Info("atis changed", "stations", len(changed))
		p.broadcast(MsgATIS, changed)
	}
}

// tickControllers fetches the vNAS controller feed, gated on its own updatedAt,
// and broadcasts only the connections that changed since the last tick. A fetch
// error keeps the last-known set so a vNAS outage never disturbs the datafeed/ATIS.
func (p *Poller) tickControllers(ctx context.Context) {
	feed, err := p.vnas.FetchControllers(ctx)
	if err != nil {
		p.logger.Warn("controller feed fetch failed", "err", err)
		return
	}
	if feed.UpdatedAt != "" && feed.UpdatedAt == p.lastControllersTS {
		return // nothing changed upstream
	}
	p.lastControllersTS = feed.UpdatedAt

	current := projectControllers(feed)
	upserted, removed := diffControllers(p.lastControllers, current)

	p.lastControllers = current
	p.store.SetControllers(current)

	if len(upserted) > 0 || len(removed) > 0 {
		p.logger.Info("controllers changed", "upserted", len(upserted), "removed", len(removed))
		p.broadcast(MsgControllers, ControllersDelta{Upserted: upserted, Removed: removed})
	}
}

// diffControllers compares the previous and current controller sets (both keyed
// by position id) and returns the connections that are new or changed (upserted)
// and the position ids that disappeared (removed). ControllerConnection is
// comparable, so a plain != detects any field change.
func diffControllers(prev, current map[string]ControllerConnection) (upserted []ControllerConnection, removed []string) {
	for id, c := range current {
		if p, ok := prev[id]; !ok || p != c {
			upserted = append(upserted, c)
		}
	}
	for id := range prev {
		if _, ok := current[id]; !ok {
			removed = append(removed, id)
		}
	}
	return upserted, removed
}

// projectControllers flattens the feed to one ControllerConnection per staffed
// position, keyed by position id (a controller on combined positions yields
// several entries).
func projectControllers(feed *vnas.ControllerFeed) map[string]ControllerConnection {
	out := make(map[string]ControllerConnection)
	for _, c := range feed.Controllers {
		for _, pos := range c.Positions {
			if pos.PositionId == "" {
				continue
			}
			out[pos.PositionId] = ControllerConnection{
				Cid:          c.VatsimData.Cid,
				Callsign:     c.VatsimData.Callsign,
				ArtccId:      c.ArtccId,
				FacilityId:   pos.FacilityId,
				FacilityName: pos.FacilityName,
				PositionId:   pos.PositionId,
				PositionName: pos.PositionName,
				RadioName:    pos.RadioName,
				PositionType: pos.PositionType,
				Frequency:    vnas.FormatFreq(pos.Frequency),
				IsPrimary:    pos.IsPrimary,
				IsActive:     c.IsActive,
				IsObserver:   c.IsObserver,
				LoginTime:    c.LoginTime,
			}
		}
	}
	return out
}

func (p *Poller) fetchMetars(ctx context.Context, stations []string) map[string]string {
	now := time.Now()
	result := map[string]string{}
	var toFetch []string

	p.metarMu.Lock()
	for _, s := range stations {
		if e, ok := p.metarCache[s]; ok && now.Sub(e.at) < metarTTL {
			result[s] = e.text
		} else {
			toFetch = append(toFetch, s)
		}
	}
	p.metarMu.Unlock()

	var wg sync.WaitGroup
	var mu sync.Mutex
	sem := make(chan struct{}, 8)
	for _, s := range toFetch {
		wg.Add(1)
		go func(icao string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			txt := p.client.FetchMetar(ctx, icao)
			mu.Lock()
			result[icao] = txt
			mu.Unlock()

			p.metarMu.Lock()
			p.metarCache[icao] = metarEntry{text: txt, at: time.Now()}
			p.metarMu.Unlock()
		}(s)
	}
	wg.Wait()
	return result
}

func (p *Poller) persistAtis(ctx context.Context, r atis.Report) {
	raw, err := json.Marshal(r)
	if err != nil {
		return
	}
	err = p.queries.UpsertAtisState(ctx, sqlc.UpsertAtisStateParams{
		Station:    r.ICAO,
		CodeLetter: pgtype.Text{String: r.AtisLetter, Valid: r.AtisLetter != ""},
		RawReport:  raw,
	})
	if err != nil {
		p.logger.Warn("persist atis_state failed", "station", r.ICAO, "err", err)
	}
}

func (p *Poller) broadcast(t MessageType, data any) {
	b, err := json.Marshal(Message{Type: t, TS: time.Now().UnixMilli(), Data: data})
	if err != nil {
		p.logger.Error("marshal ws message failed", "type", t, "err", err)
		return
	}
	p.hub.Broadcast(b)
}

func projectDatafeed(feed *vatsim.Datafeed) *DatafeedProjection {
	pilots := make([]PilotMarker, 0, len(feed.Pilots))
	for _, pl := range feed.Pilots {
		m := PilotMarker{
			Callsign:    pl.Callsign,
			Lat:         pl.Latitude,
			Lon:         pl.Longitude,
			Heading:     pl.Heading,
			Altitude:    pl.Altitude,
			Groundspeed: pl.Groundspeed,
		}
		if pl.FlightPlan != nil {
			m.Departure = pl.FlightPlan.Departure
			m.Arrival = pl.FlightPlan.Arrival
			m.Aircraft = pl.FlightPlan.AircraftShort
		}
		pilots = append(pilots, m)
	}
	return &DatafeedProjection{
		UpdateTimestamp:  feed.General.UpdateTimestamp,
		ConnectedClients: feed.General.ConnectedClients,
		Pilots:           pilots,
	}
}
