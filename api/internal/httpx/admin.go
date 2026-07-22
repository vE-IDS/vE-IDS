package httpx

import (
	"context"
	"encoding/json"
	"net/http"

	"veids/api/internal/auth"
	"veids/api/internal/db/sqlc"
)

// AdminFacility is the admin view of a facility the current user administers.
type AdminFacility struct {
	ID     string           `json:"id"`
	Name   string           `json:"name"`
	Region int32            `json:"region"`
	URL    string           `json:"url"`
	Active bool             `json:"active"`
	Roles  []string         `json:"roles"`           // the current user's role keys at this facility
	Staff  map[string]int64 `json:"staff,omitempty"` // facility staff CIDs, synced from VATUSA
}

// handleAdminFacilities returns the facilities the current user has access to,
// with the user's roles at each and the facility's staff CIDs. Data is read from
// the database (kept fresh by the VATUSA syncer) — no upstream call per request.
//
// @Summary  List facilities the current user administers
// @Tags     admin
// @Produce  json
// @Security CookieAuth
// @Success  200 {array}  AdminFacility
// @Failure  401 {object} errorEnvelope
// @Failure  403 {object} errorEnvelope
// @Router   /admin/facilities [get]
func (s *Server) handleAdminFacilities(w http.ResponseWriter, r *http.Request) {
	u, _ := auth.UserFrom(r.Context())
	facilities, err := s.userFacilities(r.Context(), u.Cid)
	if err != nil {
		s.logger.Warn("admin facilities lookup failed", "cid", u.Cid, "err", err)
		writeError(w, http.StatusInternalServerError, "could not load facilities")
		return
	}
	writeJSON(w, http.StatusOK, facilities)
}

// userFacilities loads and groups a CID's facility grants into one entry per
// facility (empty slice if none / no query seam).
func (s *Server) userFacilities(ctx context.Context, cid string) ([]AdminFacility, error) {
	if s.fetchFacilityRoles == nil {
		return []AdminFacility{}, nil
	}
	rows, err := s.fetchFacilityRoles(ctx, cid)
	if err != nil {
		return nil, err
	}
	return groupFacilities(rows), nil
}

// groupFacilities collapses per-role grant rows into one entry per facility,
// preserving row order (the query orders by facility_id, role_key). Rows without
// a facility (system-wide grants) are skipped.
func groupFacilities(rows []sqlc.GetUserFacilityRolesRow) []AdminFacility {
	out := []AdminFacility{}
	idx := map[string]int{}
	for _, row := range rows {
		if !row.FacilityID.Valid {
			continue
		}
		id := row.FacilityID.String
		i, ok := idx[id]
		if !ok {
			i = len(out)
			idx[id] = i
			out = append(out, AdminFacility{
				ID:     id,
				Name:   row.FacilityName.String,
				URL:    row.FacilityUrl.String,
				Region: row.FacilityRegion.Int32,
				Active: row.FacilityActive.Bool,
				Roles:  []string{},
				Staff:  parseStaff(row.FacilityMetadata),
			})
		}
		out[i].Roles = append(out[i].Roles, row.RoleKey)
	}
	return out
}

// parseStaff extracts the staff CID map from a facility's metadata JSONB.
func parseStaff(metadata []byte) map[string]int64 {
	if len(metadata) == 0 {
		return nil
	}
	var m struct {
		Staff map[string]int64 `json:"staff"`
	}
	if err := json.Unmarshal(metadata, &m); err != nil {
		return nil
	}
	return m.Staff
}
