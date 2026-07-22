package vatsim

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

// AirportData is the metadata subset the app shows (served by GET /api/airports/:icao
// and embedded in a ChartSet). Mirrors the old app's airport header block.
type AirportData struct {
	State       string `json:"state"`
	FullState   string `json:"fullState"`
	City        string `json:"city"`
	AirportName string `json:"airportName"`
	Military    bool   `json:"military"`
	FaaIdent    string `json:"faaIdent"`
	IcaoIdent   string `json:"icaoIdent"`
}

// Chart is one terminal chart. Wire-compatible with the frontend Chart type.
type Chart struct {
	ChartSeq  int    `json:"chartSeq"`
	ChartCode string `json:"chartCode"`
	ChartName string `json:"chartName"`
	PdfName   string `json:"pdfName"`
	PdfPath   string `json:"pdfPath"`
}

// ChartSet is the full charts payload for an airport (GET /api/charts?airport=).
// The airport metadata is embedded so the shape matches the old app's ChartSet.
type ChartSet struct {
	AirportData
	Apd  []Chart `json:"apd"`
	Dp   []Chart `json:"dp"`
	Star []Chart `json:"star"`
	Iap  []Chart `json:"iap"`
	Min  []Chart `json:"min"`
	Lah  []Chart `json:"lah"`
}

// --- AviationAPI v2 wire shapes ---

type v2ChartsResponse struct {
	AirportData v2AirportData `json:"airport_data"`
	Charts      v2Charts      `json:"charts"`
}

type v2AirportData struct {
	StateAbbr   string   `json:"state_abbr"`
	StateFull   string   `json:"state_full"`
	City        string   `json:"city"`
	AirportName string   `json:"airport_name"`
	IsMilitary  flexBool `json:"is_military"`
	FaaIdent    string   `json:"faa_ident"`
	IcaoIdent   string   `json:"icao_ident"`
}

type v2Charts struct {
	AirportDiagram []v2Chart `json:"airport_diagram"`
	Departure      []v2Chart `json:"departure"`
	Arrival        []v2Chart `json:"arrival"`
	Approach       []v2Chart `json:"approach"`
	General        []v2Chart `json:"general"`
}

type v2Chart struct {
	ChartName     string  `json:"chart_name"`
	ChartCode     string  `json:"chart_code"`
	ChartSequence flexInt `json:"chart_sequence"`
	PdfName       string  `json:"pdf_name"`
	PdfURL        string  `json:"pdf_url"`
}

// FetchAirportCharts fetches and parses the AviationAPI v2 charts payload for an
// airport into a ChartSet. Returns (nil, nil) when the airport isn't found (so
// callers can 404), and an error only on transport/decode failure.
func (c *Client) FetchAirportCharts(ctx context.Context, icao string) (*ChartSet, error) {
	u := fmt.Sprintf("%s/charts?airport=%s", c.chartsAPIURL, url.QueryEscape(strings.ToUpper(icao)))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch charts: %w", err)
	}
	defer resp.Body.Close()
	// AviationAPI answers an unknown/invalid ICAO with a 500 (it conflates bad
	// input with server errors), so any non-200 is treated as "no data" → the
	// handler 404s rather than 502ing on a typo'd ICAO. A genuine transport
	// failure (the resp err above) is still surfaced as an error.
	if resp.StatusCode != http.StatusOK {
		return nil, nil
	}

	var raw v2ChartsResponse
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, fmt.Errorf("decode charts: %w", err)
	}
	return parseChartSet(raw), nil
}

// parseChartSet maps the v2 wire shape into a ChartSet. Returns nil when the
// airport metadata is empty (treated as not found).
func parseChartSet(raw v2ChartsResponse) *ChartSet {
	ad := raw.AirportData
	if ad.IcaoIdent == "" && ad.FaaIdent == "" && ad.AirportName == "" {
		return nil
	}
	return &ChartSet{
		AirportData: AirportData{
			State:       ad.StateAbbr,
			FullState:   ad.StateFull,
			City:        ad.City,
			AirportName: ad.AirportName,
			Military:    bool(ad.IsMilitary),
			FaaIdent:    ad.FaaIdent,
			IcaoIdent:   ad.IcaoIdent,
		},
		Apd:  mapCharts(raw.Charts.AirportDiagram),
		Dp:   mapCharts(raw.Charts.Departure),
		Star: mapCharts(raw.Charts.Arrival),
		Iap:  mapCharts(raw.Charts.Approach),
		Min:  mapCharts(raw.Charts.General),
		Lah:  []Chart{},
	}
}

func mapCharts(in []v2Chart) []Chart {
	out := make([]Chart, 0, len(in))
	for _, c := range in {
		out = append(out, Chart{
			ChartSeq:  int(c.ChartSequence),
			ChartCode: c.ChartCode,
			ChartName: c.ChartName,
			PdfName:   c.PdfName,
			PdfPath:   c.PdfURL,
		})
	}
	return out
}

// --- tolerant scalar decoders (AviationAPI is loosely typed) ---

// flexInt unmarshals from a JSON number or a numeric string; anything else → 0.
type flexInt int

func (f *flexInt) UnmarshalJSON(b []byte) error {
	s := strings.Trim(strings.TrimSpace(string(b)), `"`)
	if s == "" || s == "null" {
		*f = 0
		return nil
	}
	if n, err := strconv.Atoi(s); err == nil {
		*f = flexInt(n)
	}
	return nil
}

// flexBool unmarshals from true/false, "Y"/"N", "true"/"false", or 1/0.
type flexBool bool

func (f *flexBool) UnmarshalJSON(b []byte) error {
	s := strings.ToLower(strings.Trim(strings.TrimSpace(string(b)), `"`))
	*f = flexBool(s == "true" || s == "y" || s == "yes" || s == "1")
	return nil
}
