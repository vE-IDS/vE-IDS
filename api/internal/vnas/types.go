package vnas

// ControllerFeed is the root of the vNAS controller data feed.
type ControllerFeed struct {
	UpdatedAt   string       `json:"updatedAt"`
	Controllers []Controller `json:"controllers"`
}

// Controller is one connected vNAS client. A controller may staff several
// Positions at once (combined positions); PrimaryPositionId points at the active
// one shown as "theirs".
type Controller struct {
	ArtccId           string     `json:"artccId"`
	PrimaryFacilityId string     `json:"primaryFacilityId"`
	PrimaryPositionId string     `json:"primaryPositionId"`
	Role              string     `json:"role"`
	IsActive          bool       `json:"isActive"`
	IsObserver        bool       `json:"isObserver"`
	LoginTime         string     `json:"loginTime"`
	Positions         []Position `json:"positions"`
	VatsimData        VatsimData `json:"vatsimData"`
}

// Position is a single controllable position a Controller is signed into.
type Position struct {
	FacilityId   string `json:"facilityId"`
	FacilityName string `json:"facilityName"`
	PositionId   string `json:"positionId"` // stable GUID
	PositionName string `json:"positionName"`
	RadioName    string `json:"radioName"`    // human-readable, e.g. "O'Hare Tower"
	PositionType string `json:"positionType"` // Artcc | Tracon | Atct
	Frequency    int    `json:"frequency"`    // Hz; FreqInactive when not transmitting
	IsPrimary    bool   `json:"isPrimary"`
	IsActive     bool   `json:"isActive"`
}

// VatsimData carries the controller's VATSIM identity. RealName is intentionally
// not surfaced downstream (PII); only cid + callsign are used.
type VatsimData struct {
	Cid      string `json:"cid"`
	Callsign string `json:"callsign"`
}
