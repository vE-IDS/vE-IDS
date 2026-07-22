package httpx

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"veids/api/internal/auth"
	"veids/api/internal/config"
	"veids/api/internal/vatsim"
)

// newTestServer builds a Server with just the pieces the charts/airports handlers
// and auth middleware need, plus a stub charts fetcher.
func newTestServer(fetch chartsFetcher) *Server {
	jwt := auth.NewJWTManager("test-signing-key", time.Minute)
	return &Server{
		cfg:         config.Config{Env: "dev", ChartsCacheTTL: time.Hour},
		logger:      slog.New(slog.DiscardHandler),
		jwt:         jwt,
		chartsTTL:   time.Hour,
		chartsCache: map[string]cachedCharts{},
		fetchCharts: fetch,
	}
}

func authCookie(t *testing.T, s *Server) *http.Cookie {
	t.Helper()
	tok, err := s.jwt.Issue("1000001", "1000001", 5)
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	return &http.Cookie{Name: auth.AccessCookie, Value: tok}
}

func TestHandleCharts_Happy(t *testing.T) {
	s := newTestServer(func(_ context.Context, icao string) (*vatsim.ChartSet, error) {
		if icao != "KATL" {
			t.Errorf("icao = %q, want KATL (upper-cased)", icao)
		}
		return &vatsim.ChartSet{
			AirportData: vatsim.AirportData{IcaoIdent: "KATL", AirportName: "Atlanta"},
			Apd:         []vatsim.Chart{{ChartName: "AIRPORT DIAGRAM"}},
		}, nil
	})

	req := httptest.NewRequest(http.MethodGet, "/api/charts?airport=katl", nil)
	req.AddCookie(authCookie(t, s))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (%s)", rec.Code, rec.Body.String())
	}
	var cs vatsim.ChartSet
	if err := json.Unmarshal(rec.Body.Bytes(), &cs); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if cs.IcaoIdent != "KATL" || len(cs.Apd) != 1 {
		t.Errorf("body = %+v", cs)
	}
}

func TestHandleCharts_Unauthorized(t *testing.T) {
	s := newTestServer(func(context.Context, string) (*vatsim.ChartSet, error) {
		t.Fatal("fetch should not be called when unauthorized")
		return nil, nil
	})
	req := httptest.NewRequest(http.MethodGet, "/api/charts?airport=KATL", nil) // no cookie
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
}

func TestHandleCharts_MissingAirport(t *testing.T) {
	s := newTestServer(func(context.Context, string) (*vatsim.ChartSet, error) {
		t.Fatal("fetch should not be called without an airport param")
		return nil, nil
	})
	req := httptest.NewRequest(http.MethodGet, "/api/charts", nil)
	req.AddCookie(authCookie(t, s))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (%s)", rec.Code, rec.Body.String())
	}
}

func TestHandleCharts_NotFound(t *testing.T) {
	s := newTestServer(func(context.Context, string) (*vatsim.ChartSet, error) {
		return nil, nil // upstream: airport not found
	})
	req := httptest.NewRequest(http.MethodGet, "/api/charts?airport=ZZZZ", nil)
	req.AddCookie(authCookie(t, s))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
}

func TestHandleAirport_Happy(t *testing.T) {
	s := newTestServer(func(context.Context, string) (*vatsim.ChartSet, error) {
		return &vatsim.ChartSet{AirportData: vatsim.AirportData{IcaoIdent: "KATL", City: "Atlanta"}}, nil
	})
	req := httptest.NewRequest(http.MethodGet, "/api/airports/KATL", nil)
	req.AddCookie(authCookie(t, s))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (%s)", rec.Code, rec.Body.String())
	}
	var ad vatsim.AirportData
	if err := json.Unmarshal(rec.Body.Bytes(), &ad); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if ad.IcaoIdent != "KATL" || ad.City != "Atlanta" {
		t.Errorf("body = %+v", ad)
	}
}
