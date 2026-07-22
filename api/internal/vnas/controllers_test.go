package vnas

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

const feedFixture = `{
  "updatedAt": "2026-07-22T18:30:00Z",
  "controllers": [
    {
      "artccId": "ZJX",
      "primaryFacilityId": "JAX",
      "primaryPositionId": "p-app-1",
      "role": "Controller",
      "isActive": true,
      "isObserver": false,
      "loginTime": "2026-07-22T17:00:00Z",
      "positions": [
        {"facilityId": "JAX", "facilityName": "Jacksonville", "positionId": "p-app-1", "positionName": "Approach", "radioName": "Jacksonville Approach", "positionType": "Tracon", "frequency": 124400000, "isPrimary": true, "isActive": true}
      ],
      "vatsimData": {"cid": "1234567", "realName": "Jane Doe", "callsign": "JAX_APP"}
    },
    {
      "artccId": "ZAU",
      "primaryFacilityId": "ORD",
      "primaryPositionId": "p-twr-1",
      "role": "Instructor",
      "isActive": true,
      "isObserver": false,
      "loginTime": "2026-07-22T16:30:00Z",
      "positions": [
        {"facilityId": "ORD", "facilityName": "O'Hare", "positionId": "p-twr-1", "positionName": "Tower", "positionType": "Atct", "frequency": 120900000, "isPrimary": true, "isActive": true},
        {"facilityId": "ORD", "facilityName": "O'Hare", "positionId": "p-gnd-1", "positionName": "Ground", "positionType": "Atct", "frequency": 121900000, "isPrimary": false, "isActive": true}
      ],
      "vatsimData": {"cid": "7654321", "realName": "John Roe", "callsign": "ORD_TWR"}
    }
  ]
}`

func TestFetchControllers(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(feedFixture))
	}))
	defer srv.Close()

	f, err := New(srv.URL).FetchControllers(context.Background())
	if err != nil {
		t.Fatalf("FetchControllers: %v", err)
	}
	if f.UpdatedAt != "2026-07-22T18:30:00Z" {
		t.Errorf("UpdatedAt = %q", f.UpdatedAt)
	}
	if len(f.Controllers) != 2 {
		t.Fatalf("controllers = %d, want 2", len(f.Controllers))
	}

	jax := f.Controllers[0]
	if jax.ArtccId != "ZJX" || jax.VatsimData.Cid != "1234567" || jax.VatsimData.Callsign != "JAX_APP" {
		t.Errorf("jax identity mismatch: %+v", jax)
	}
	if len(jax.Positions) != 1 || jax.Positions[0].PositionId != "p-app-1" || !jax.Positions[0].IsPrimary {
		t.Errorf("jax position mismatch: %+v", jax.Positions)
	}
	if jax.Positions[0].RadioName != "Jacksonville Approach" {
		t.Errorf("jax radioName = %q", jax.Positions[0].RadioName)
	}

	// Combined controller staffs two positions.
	ord := f.Controllers[1]
	if len(ord.Positions) != 2 {
		t.Fatalf("ord positions = %d, want 2 (combined)", len(ord.Positions))
	}
	if ord.Positions[1].PositionName != "Ground" || ord.Positions[1].IsPrimary {
		t.Errorf("ord second position mismatch: %+v", ord.Positions[1])
	}
}

func TestFetchControllers_UpstreamStatus(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer srv.Close()

	if _, err := New(srv.URL).FetchControllers(context.Background()); err == nil {
		t.Fatal("expected error on non-200 status, got nil")
	}
}
