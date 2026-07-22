package vatusa

import (
	"context"
	"fmt"
	"net/url"
)

// wire structs: the raw VATUSA payload shapes (only the fields we consume).

type facilityListResponse struct {
	Data []facilityInfo `json:"data"`
}

type facilityInfo struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	URL    string `json:"url"`
	Region int    `json:"region"`
	Active int    `json:"active"` // 0/1
	ATM    int64  `json:"atm"`
	DATM   int64  `json:"datm"`
	TA     int64  `json:"ta"`
	FE     int64  `json:"fe"`
	EC     int64  `json:"ec"`
	WM     int64  `json:"wm"`
}

func (fi facilityInfo) toFacility() Facility {
	return Facility{
		ID:     fi.ID,
		Name:   fi.Name,
		URL:    fi.URL,
		Region: fi.Region,
		Active: fi.Active == 1,
		Staff:  Staff{ATM: fi.ATM, DATM: fi.DATM, TA: fi.TA, FE: fi.FE, EC: fi.EC, WM: fi.WM},
	}
}

type facilityDetailResponse struct {
	Data struct {
		Facility struct {
			Roles []struct {
				CID  int64  `json:"cid"`
				Role string `json:"role"`
			} `json:"roles"`
		} `json:"facility"`
	} `json:"data"`
}

// FetchFacilities returns all VATUSA facilities with their staff CIDs.
func (c *Client) FetchFacilities(ctx context.Context) ([]Facility, error) {
	var resp facilityListResponse
	if err := c.getJSON(ctx, "/facility", &resp); err != nil {
		return nil, fmt.Errorf("fetch facilities: %w", err)
	}
	out := make([]Facility, 0, len(resp.Data))
	for _, fi := range resp.Data {
		out = append(out, fi.toFacility())
	}
	return out, nil
}

// FetchFacilityRoles returns the role assignments on a facility's roster. This
// is the only source of the FACCBT (FAA CBT / instructor) role, which is not
// present in the facility list.
func (c *Client) FetchFacilityRoles(ctx context.Context, id string) ([]RosterRole, error) {
	var resp facilityDetailResponse
	if err := c.getJSON(ctx, "/facility/"+url.PathEscape(id), &resp); err != nil {
		return nil, fmt.Errorf("fetch facility roles %s: %w", id, err)
	}
	roles := resp.Data.Facility.Roles
	out := make([]RosterRole, 0, len(roles))
	for _, r := range roles {
		out = append(out, RosterRole{CID: r.CID, Role: r.Role})
	}
	return out, nil
}
