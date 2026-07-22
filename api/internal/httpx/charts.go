package httpx

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"veids/api/internal/vatsim"
)

// handleCharts serves GET /api/charts?airport=ICAO — the full ChartSet for an
// airport (AviationAPI v2, cached).
//
// @Summary  Airport charts
// @Tags     charts
// @Produce  json
// @Security CookieAuth
// @Param    airport query string true "Airport ICAO (e.g. KATL)"
// @Success  200 {object} vatsim.ChartSet
// @Failure  400 {object} errorEnvelope
// @Failure  404 {object} errorEnvelope
// @Router   /charts [get]
func (s *Server) handleCharts(w http.ResponseWriter, r *http.Request) {
	airport := strings.TrimSpace(r.URL.Query().Get("airport"))
	if airport == "" {
		writeError(w, http.StatusBadRequest, "airport query parameter is required")
		return
	}
	cs, err := s.getCharts(r.Context(), airport)
	if err != nil {
		s.logger.Warn("charts fetch failed", "airport", airport, "err", err)
		writeError(w, http.StatusBadGateway, "could not fetch charts")
		return
	}
	if cs == nil {
		writeError(w, http.StatusNotFound, "airport not found")
		return
	}
	writeJSON(w, http.StatusOK, cs)
}

// handleAirport serves GET /api/airports/:icao — the airport metadata subset,
// sourced from the same cached AviationAPI response as charts.
//
// @Summary  Airport metadata
// @Tags     charts
// @Produce  json
// @Security CookieAuth
// @Param    icao path string true "Airport ICAO (e.g. KATL)"
// @Success  200 {object} vatsim.AirportData
// @Failure  404 {object} errorEnvelope
// @Router   /airports/{icao} [get]
func (s *Server) handleAirport(w http.ResponseWriter, r *http.Request) {
	icao := strings.TrimSpace(chi.URLParam(r, "icao"))
	if icao == "" {
		writeError(w, http.StatusBadRequest, "icao is required")
		return
	}
	cs, err := s.getCharts(r.Context(), icao)
	if err != nil {
		s.logger.Warn("airport fetch failed", "icao", icao, "err", err)
		writeError(w, http.StatusBadGateway, "could not fetch airport")
		return
	}
	if cs == nil {
		writeError(w, http.StatusNotFound, "airport not found")
		return
	}
	writeJSON(w, http.StatusOK, cs.AirportData)
}

// getCharts returns the ChartSet for an ICAO, served from a TTL cache. A nil
// result (airport not found) is returned as-is and not cached.
func (s *Server) getCharts(ctx context.Context, icao string) (*vatsim.ChartSet, error) {
	key := strings.ToUpper(icao)

	s.chartsMu.Lock()
	if c, ok := s.chartsCache[key]; ok && time.Since(c.at) < s.chartsTTL {
		s.chartsMu.Unlock()
		return c.data, nil
	}
	s.chartsMu.Unlock()

	cs, err := s.fetchCharts(ctx, key)
	if err != nil {
		return nil, err
	}
	if cs != nil {
		s.chartsMu.Lock()
		s.chartsCache[key] = cachedCharts{data: cs, at: time.Now()}
		s.chartsMu.Unlock()
	}
	return cs, nil
}
