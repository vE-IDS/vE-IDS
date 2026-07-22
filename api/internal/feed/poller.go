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
	store    *Store
	hub      *Hub
	queries  *sqlc.Queries
	interval time.Duration
	logger   *slog.Logger

	lastTimestamp string

	metarMu    sync.Mutex
	metarCache map[string]metarEntry
}

// NewPoller constructs a Poller.
func NewPoller(client *vatsim.Client, store *Store, hub *Hub, queries *sqlc.Queries, interval time.Duration, logger *slog.Logger) *Poller {
	return &Poller{
		client:     client,
		store:      store,
		hub:        hub,
		queries:    queries,
		interval:   interval,
		logger:     logger,
		metarCache: map[string]metarEntry{},
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
