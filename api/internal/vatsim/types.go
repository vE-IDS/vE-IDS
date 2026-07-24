// Package vatsim provides typed clients for the upstream aviation data feeds:
// the VATSIM v3 datafeed, aviationweather.gov METARs, and AviationAPI v2 charts.
// It only decodes the subset of each payload the app actually uses.
package vatsim

// Datafeed is the subset of the VATSIM v3 datafeed the app consumes.
type Datafeed struct {
	General     General      `json:"general"`
	Pilots      []Pilot      `json:"pilots"`
	Controllers []Controller `json:"controllers"`
	Atis        []ATISEntry  `json:"atis"`
}

type General struct {
	Version          int    `json:"version"`
	UpdateTimestamp  string `json:"update_timestamp"`
	ConnectedClients int    `json:"connected_clients"`
	UniqueUsers      int    `json:"unique_users"`
}

type Pilot struct {
	Cid         int         `json:"cid"`
	Callsign    string      `json:"callsign"`
	Latitude    float64     `json:"latitude"`
	Longitude   float64     `json:"longitude"`
	Altitude    int         `json:"altitude"`
	Groundspeed int         `json:"groundspeed"`
	Heading     int         `json:"heading"`
	FlightPlan  *FlightPlan `json:"flight_plan"`
}

type FlightPlan struct {
	Aircraft      string `json:"aircraft"`
	AircraftShort string `json:"aircraft_short"`
	Departure     string `json:"departure"`
	Arrival       string `json:"arrival"`
}

type Controller struct {
	Callsign  string `json:"callsign"`
	Frequency string `json:"frequency"`
	Facility  int    `json:"facility"`
	Rating    int    `json:"rating"`
}

type ATISEntry struct {
	Callsign  string   `json:"callsign"`
	Frequency string   `json:"frequency"`
	AtisCode  string   `json:"atis_code"`
	TextAtis  []string `json:"text_atis"`
}

// VatsimUser is the VATSIM Connect /api/user profile response.
type VatsimUser struct {
	Data struct {
		Cid      string `json:"cid"`
		Personal struct {
			NameFirst string `json:"name_first"`
			NameLast  string `json:"name_last"`
			NameFull  string `json:"name_full"`
			Email     string `json:"email"`
		} `json:"personal"`
		Vatsim struct {
			Rating struct {
				ID    int    `json:"id"`
				Short string `json:"short"`
				Long  string `json:"long"`
			} `json:"rating"`
		} `json:"vatsim"`
	} `json:"data"`
}
