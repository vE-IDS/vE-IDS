package httpx

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"veids/api/internal/auth"
	"veids/api/internal/config"
	"veids/api/internal/db/sqlc"
)

func newAdminTestServer(perms permsFetcher, roles facilityRolesFetcher) *Server {
	return &Server{
		cfg:                config.Config{Env: "dev"},
		logger:             slog.New(slog.DiscardHandler),
		jwt:                auth.NewJWTManager("test-signing-key", time.Minute),
		fetchPerms:         perms,
		fetchFacilityRoles: roles,
	}
}

func zjxGrantRow() sqlc.GetUserFacilityRolesRow {
	return sqlc.GetUserFacilityRolesRow{
		FacilityID:       pgtype.Text{String: "ZJX", Valid: true},
		RoleKey:          "facility.atm",
		Source:           "vatusa",
		FacilityName:     pgtype.Text{String: "Jacksonville ARTCC", Valid: true},
		FacilityUrl:      pgtype.Text{String: "https://zjxartcc.org", Valid: true},
		FacilityRegion:   pgtype.Int4{Int32: 7, Valid: true},
		FacilityActive:   pgtype.Bool{Bool: true, Valid: true},
		FacilityMetadata: []byte(`{"staff":{"atm":989429,"datm":1655242}}`),
	}
}

func TestHandleAdminFacilities_Happy(t *testing.T) {
	s := newAdminTestServer(
		func(context.Context, string) ([]string, error) {
			return []string{"system.access", "facility.view"}, nil
		},
		func(context.Context, string) ([]sqlc.GetUserFacilityRolesRow, error) {
			return []sqlc.GetUserFacilityRolesRow{zjxGrantRow()}, nil
		},
	)

	req := httptest.NewRequest(http.MethodGet, "/api/admin/facilities", nil)
	req.AddCookie(authCookie(t, s))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (%s)", rec.Code, rec.Body.String())
	}
	var facs []AdminFacility
	if err := json.Unmarshal(rec.Body.Bytes(), &facs); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(facs) != 1 {
		t.Fatalf("want 1 facility, got %d", len(facs))
	}
	f := facs[0]
	if f.ID != "ZJX" || f.Region != 7 || !f.Active {
		t.Errorf("unexpected facility: %+v", f)
	}
	if len(f.Roles) != 1 || f.Roles[0] != "facility.atm" {
		t.Errorf("unexpected roles: %v", f.Roles)
	}
	if f.Staff["atm"] != 989429 {
		t.Errorf("unexpected staff: %v", f.Staff)
	}
}

func TestHandleAdminFacilities_Unauthorized(t *testing.T) {
	s := newAdminTestServer(
		func(context.Context, string) ([]string, error) {
			t.Fatal("perms should not be checked without auth")
			return nil, nil
		},
		func(context.Context, string) ([]sqlc.GetUserFacilityRolesRow, error) { return nil, nil },
	)
	req := httptest.NewRequest(http.MethodGet, "/api/admin/facilities", nil) // no cookie
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
}

func TestHandleAdminFacilities_Forbidden(t *testing.T) {
	s := newAdminTestServer(
		func(context.Context, string) ([]string, error) { return []string{}, nil }, // authed, but no access
		func(context.Context, string) ([]sqlc.GetUserFacilityRolesRow, error) {
			t.Fatal("facilities should not be loaded without system.access")
			return nil, nil
		},
	)
	req := httptest.NewRequest(http.MethodGet, "/api/admin/facilities", nil)
	req.AddCookie(authCookie(t, s))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403 (%s)", rec.Code, rec.Body.String())
	}
}
