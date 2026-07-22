// Package feed runs the single VATSIM datafeed poller and the WebSocket hub that
// fans live updates out to connected clients. Only two things flow over the
// socket: datafeed updates and ATIS updates (pushed only when an ATIS changes).
package feed

import "veids/api/internal/atis"

// MessageType tags a server->client WebSocket message.
type MessageType string

const (
	// MsgSnapshot is sent once, immediately on connect, with the current state.
	MsgSnapshot MessageType = "snapshot"
	// MsgDatafeed is a datafeed projection update (sent each changed poll tick).
	MsgDatafeed MessageType = "datafeed"
	// MsgATIS carries only the ATIS reports that changed this tick.
	MsgATIS MessageType = "atis"
)

// Message is the envelope for every server->client frame.
type Message struct {
	Type MessageType `json:"type"`
	TS   int64       `json:"ts"` // unix milliseconds
	Data any         `json:"data"`
}

// PilotMarker is the slim per-aircraft projection the map renders.
type PilotMarker struct {
	Callsign    string  `json:"callsign"`
	Lat         float64 `json:"lat"`
	Lon         float64 `json:"lon"`
	Heading     int     `json:"heading"`
	Altitude    int     `json:"altitude"`
	Groundspeed int     `json:"groundspeed"`
	Departure   string  `json:"departure,omitempty"`
	Arrival     string  `json:"arrival,omitempty"`
	Aircraft    string  `json:"aircraft,omitempty"`
}

// DatafeedProjection is the trimmed datafeed pushed to clients (the raw feed is
// multiple MB, so we ship only what the dashboard renders).
type DatafeedProjection struct {
	UpdateTimestamp  string        `json:"updateTimestamp"`
	ConnectedClients int           `json:"connectedClients"`
	Pilots           []PilotMarker `json:"pilots"`
}

// SnapshotData is the payload of a MsgSnapshot: everything a fresh client needs.
type SnapshotData struct {
	Datafeed *DatafeedProjection `json:"datafeed"`
	Atis     []atis.Report       `json:"atis"`
}
