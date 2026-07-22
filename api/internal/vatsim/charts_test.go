package vatsim

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

const katlChartsFixture = `{
  "airport_data": {
    "state_abbr": "GA",
    "state_full": "Georgia",
    "city": "Atlanta",
    "airport_name": "Hartsfield - Jackson Atlanta Intl",
    "is_military": "N",
    "faa_ident": "ATL",
    "icao_ident": "KATL"
  },
  "charts": {
    "airport_diagram": [
      {"chart_name": "AIRPORT DIAGRAM", "chart_code": "APD", "chart_sequence": "70000", "pdf_name": "00026AD.PDF", "pdf_url": "https://charts.example/00026AD.PDF"}
    ],
    "departure": [
      {"chart_name": "ATLANTA EIGHT", "chart_code": "DP", "chart_sequence": 90000, "pdf_name": "dep.PDF", "pdf_url": "https://charts.example/dep.PDF"}
    ],
    "arrival": [],
    "approach": [
      {"chart_name": "ILS OR LOC RWY 08L", "chart_code": "IAP", "chart_sequence": "52000", "pdf_name": "app.PDF", "pdf_url": "https://charts.example/app.PDF"}
    ],
    "general": []
  }
}`

func TestFetchAirportCharts(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("airport") != "KATL" {
			t.Errorf("airport param = %q, want KATL", r.URL.Query().Get("airport"))
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(katlChartsFixture))
	}))
	defer srv.Close()

	c := New("", "", srv.URL)
	cs, err := c.FetchAirportCharts(context.Background(), "katl")
	if err != nil {
		t.Fatalf("FetchAirportCharts: %v", err)
	}
	if cs == nil {
		t.Fatal("ChartSet is nil, want data")
	}

	if cs.IcaoIdent != "KATL" || cs.FaaIdent != "ATL" {
		t.Errorf("idents = %q/%q, want KATL/ATL", cs.IcaoIdent, cs.FaaIdent)
	}
	if cs.AirportName != "Hartsfield - Jackson Atlanta Intl" || cs.City != "Atlanta" || cs.FullState != "Georgia" {
		t.Errorf("metadata mismatch: %+v", cs.AirportData)
	}
	if cs.Military {
		t.Error("Military = true, want false (is_military N)")
	}
	// chart_sequence parsed from a quoted string.
	if len(cs.Apd) != 1 || cs.Apd[0].ChartName != "AIRPORT DIAGRAM" || cs.Apd[0].ChartSeq != 70000 {
		t.Errorf("apd = %+v", cs.Apd)
	}
	// chart_sequence parsed from a bare JSON number.
	if len(cs.Dp) != 1 || cs.Dp[0].ChartSeq != 90000 || cs.Dp[0].PdfPath != "https://charts.example/dep.PDF" {
		t.Errorf("dp = %+v", cs.Dp)
	}
	if len(cs.Iap) != 1 || cs.Iap[0].ChartName != "ILS OR LOC RWY 08L" {
		t.Errorf("iap = %+v", cs.Iap)
	}
	if len(cs.Star) != 0 || len(cs.Min) != 0 || len(cs.Lah) != 0 {
		t.Errorf("expected empty star/min/lah, got %d/%d/%d", len(cs.Star), len(cs.Min), len(cs.Lah))
	}
}

func TestFetchAirportCharts_NotFound(t *testing.T) {
	// Empty airport_data → treated as not found (nil, nil).
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"airport_data":{},"charts":{}}`))
	}))
	defer srv.Close()

	cs, err := New("", "", srv.URL).FetchAirportCharts(context.Background(), "ZZZZ")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cs != nil {
		t.Errorf("ChartSet = %+v, want nil", cs)
	}
}

func TestFetchAirportCharts_UpstreamStatus(t *testing.T) {
	// AviationAPI returns 500 for an unknown ICAO (and might 4xx); any non-200 is
	// treated as "no data" (nil), not an error, so the handler 404s.
	for _, status := range []int{http.StatusInternalServerError, http.StatusUnprocessableEntity} {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(status)
		}))
		cs, err := New("", "", srv.URL).FetchAirportCharts(context.Background(), "ZZZZ")
		srv.Close()
		if err != nil {
			t.Errorf("status %d: unexpected error: %v", status, err)
		}
		if cs != nil {
			t.Errorf("status %d: ChartSet = %+v, want nil", status, cs)
		}
	}
}
