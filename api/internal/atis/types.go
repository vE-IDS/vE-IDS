// Package atis assembles per-airport ATIS reports from the VATSIM datafeed and
// METARs. Its Report is JSON-shaped to match the frontend AirportWeather DTO
// (frontend/src/types/weather.type.ts) so the Airports panel can consume WS
// messages directly.
package atis

import "veids/api/internal/parser"

// Report is one airport's combined ATIS + METAR view. Wire-compatible with the
// frontend AirportWeather type.
type Report struct {
	ICAO           string                `json:"icao"`
	AirportName    string                `json:"airportName,omitempty"`
	AtisAvailable  bool                  `json:"atisAvailable"`
	AtisLetter     string                `json:"atisLetter,omitempty"`
	AtisText       string                `json:"atisText,omitempty"`
	Metar          string                `json:"metar"`
	FlightCategory parser.FlightCategory `json:"flightCategory"`
	Wind           *parser.Wind          `json:"wind,omitempty"`
	Altimeter      *float64              `json:"altimeter,omitempty"`
}
