package httpx

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"veids/api/internal/atis"
)

func TestHandleAirportWeather_Happy(t *testing.T) {
	s := newTestServer(nil)
	s.fetchMetar = func(_ context.Context, icao string) string {
		if icao != "KMCO" {
			t.Errorf("icao = %q, want KMCO", icao)
		}
		return "KMCO 220153Z 18003KT 10SM FEW250 28/21 A2999"
	}

	req := httptest.NewRequest(http.MethodGet, "/api/airports/KMCO/weather", nil)
	req.AddCookie(authCookie(t, s))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (%s)", rec.Code, rec.Body.String())
	}
	var rep atis.Report
	if err := json.Unmarshal(rec.Body.Bytes(), &rep); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if rep.AtisAvailable {
		t.Error("atisAvailable = true, want false (METAR-only fallback)")
	}
	if rep.Wind == nil || rep.Wind.Direction != "180" || rep.Wind.Speed != 3 {
		t.Errorf("wind = %+v, want 180@3", rep.Wind)
	}
	if rep.Altimeter == nil || *rep.Altimeter != 29.99 {
		t.Errorf("altimeter = %v, want 29.99", rep.Altimeter)
	}
}

func TestHandleAirportWeather_Unauthorized(t *testing.T) {
	s := newTestServer(nil)
	s.fetchMetar = func(context.Context, string) string {
		t.Fatal("fetchMetar should not be called when unauthorized")
		return ""
	}
	req := httptest.NewRequest(http.MethodGet, "/api/airports/KMCO/weather", nil) // no cookie
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
}
