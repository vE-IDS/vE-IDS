package vatusa

// Facility is a VATUSA ARTCC and its current staff CIDs, from GET /facility.
type Facility struct {
	ID     string
	Name   string
	URL    string
	Region int
	Active bool
	Staff  Staff
}

// Staff holds the CIDs of a facility's staff positions. A zero value means the
// position is vacant. EC/WM are captured for display but do not grant access.
type Staff struct {
	ATM  int64
	DATM int64
	TA   int64
	FE   int64
	EC   int64
	WM   int64
}

// RosterRole is a single role assignment from a facility roster, from
// GET /facility/{id} (data.facility.roles[]). Role values seen include
// ATM, DATM, TA, FE, EC, WM, FACCBT, INS, MTR.
type RosterRole struct {
	CID  int64
	Role string
}
