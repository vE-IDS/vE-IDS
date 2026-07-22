// Package parser turns raw ATIS or METAR text into structured data: runways,
// weather (wind, altimeter, visibility, RVR, clouds), NOTAMs, frequencies, the
// ATIS code letter, and a derived flight category.
//
// It is a faithful Go port of the old app's src/lib/atisParser.ts. The single
// Parse function is used for BOTH ATIS text and METAR text (as the original was),
// so wind/altimeter/category can be derived from whichever source parses. Some
// quirks of the original (e.g. treating a visibility/ceiling of 0 as "unknown")
// are preserved intentionally so behavior matches the legacy system.
package parser

// FlightCategory is the standard aviation flight-rules category.
type FlightCategory string

const (
	VFR  FlightCategory = "VFR"
	MVFR FlightCategory = "MVFR"
	IFR  FlightCategory = "IFR"
	LIFR FlightCategory = "LIFR"
)

// AtisType classifies whether an ATIS covers arrivals, departures, or both.
type AtisType string

const (
	AtisArrival   AtisType = "ARRIVAL"
	AtisDeparture AtisType = "DEPARTURE"
	AtisCombined  AtisType = "COMBINED"
	AtisUnknown   AtisType = "UNKNOWN"
)

// Wind is a decoded surface wind. Direction is a 3-char string or "VRB".
type Wind struct {
	Direction string `json:"direction"`
	Speed     int    `json:"speed"`
	Gust      *int   `json:"gust,omitempty"`
}

// RVR is a runway visual range group.
type RVR struct {
	Runway   string `json:"runway"`
	MinRange int    `json:"minRange"`
	MaxRange *int   `json:"maxRange,omitempty"`
}

// CloudLayer is one reported sky-cover layer; Altitude is in feet AGL.
type CloudLayer struct {
	Coverage string `json:"coverage"`
	Altitude int    `json:"altitude"`
}

// Weather holds the parsed meteorological fields.
type Weather struct {
	Altimeter   *float64     `json:"altimeter"`
	Wind        *Wind        `json:"wind"`
	Visibility  *float64     `json:"visibility"`
	RVR         *RVR         `json:"rvr"`
	CloudLayers []CloudLayer `json:"cloudLayers"`
}

// Runways is the set of landing/departure runways extracted from ATIS phrasing.
type Runways struct {
	LandingRunways   []string `json:"landingRunways"`
	DepartureRunways []string `json:"departureRunways"`
}

// Parsed is the full result of parsing one ATIS/METAR text.
type Parsed struct {
	Runways        Runways        `json:"runways"`
	Weather        Weather        `json:"weather"`
	Notams         []string       `json:"notams"`
	Frequencies    []string       `json:"frequencies"`
	FlightCategory FlightCategory `json:"flightCategory"`
	AtisCode       string         `json:"atisCode,omitempty"`
	AtisType       AtisType       `json:"atisType"`
	AtisTimeZ      string         `json:"atisTimeZ,omitempty"`
}
