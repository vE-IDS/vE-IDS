package feed

import (
	"encoding/json"
	"sync"
	"time"

	"veids/api/internal/atis"
)

// Store holds the latest in-memory datafeed projection and ATIS reports, plus
// the last-seen ATIS code letter per station for change detection. All access is
// guarded so the poller (writer) and WS handlers (readers) are safe concurrently.
type Store struct {
	mu          sync.RWMutex
	datafeed    *DatafeedProjection
	atisReports []atis.Report
	lastLetter  map[string]string
	controllers map[string]ControllerConnection // keyed by position id
}

// NewStore returns an empty Store.
func NewStore() *Store {
	return &Store{lastLetter: map[string]string{}, controllers: map[string]ControllerConnection{}}
}

// SetDatafeed replaces the current datafeed projection.
func (s *Store) SetDatafeed(p *DatafeedProjection) {
	s.mu.Lock()
	s.datafeed = p
	s.mu.Unlock()
}

// SetAtis replaces the current set of ATIS reports (used for new-client snapshots).
func (s *Store) SetAtis(reports []atis.Report) {
	s.mu.Lock()
	s.atisReports = reports
	s.mu.Unlock()
}

// SetControllers replaces the current controller set (used for new-client
// snapshots). The map is stored by reference; the caller must not mutate it after
// handing it over.
func (s *Store) SetControllers(m map[string]ControllerConnection) {
	s.mu.Lock()
	s.controllers = m
	s.mu.Unlock()
}

// LastLetter returns the last-broadcast ATIS code letter for a station.
func (s *Store) LastLetter(station string) string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.lastLetter[station]
}

// SetLastLetter records the latest ATIS code letter for a station.
func (s *Store) SetLastLetter(station, letter string) {
	s.mu.Lock()
	s.lastLetter[station] = letter
	s.mu.Unlock()
}

// Seed initializes the change-detection map and ATIS reports from persisted
// state (called on boot so a restart doesn't re-broadcast every station).
func (s *Store) Seed(reports []atis.Report) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.atisReports = reports
	for _, r := range reports {
		s.lastLetter[r.ICAO] = r.AtisLetter
	}
}

// Snapshot returns a consistent copy of the current state.
func (s *Store) Snapshot() SnapshotData {
	s.mu.RLock()
	defer s.mu.RUnlock()
	reports := make([]atis.Report, len(s.atisReports))
	copy(reports, s.atisReports)
	controllers := make([]ControllerConnection, 0, len(s.controllers))
	for _, c := range s.controllers {
		controllers = append(controllers, c)
	}
	return SnapshotData{Datafeed: s.datafeed, Atis: reports, Controllers: controllers}
}

// SnapshotMessage marshals the current state as a MsgSnapshot envelope.
func (s *Store) SnapshotMessage() ([]byte, error) {
	msg := Message{Type: MsgSnapshot, TS: time.Now().UnixMilli(), Data: s.Snapshot()}
	return json.Marshal(msg)
}
