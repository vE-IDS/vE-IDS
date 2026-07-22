package httpx

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"veids/api/internal/atis"
)

// handleAirportWeather serves GET /api/airports/:icao/weather — a METAR-only
// weather report for an airport, used as the fallback when no VATSIM ATIS is
// online (the WebSocket only carries stations with an active ATIS). Wire-shape
// matches the frontend AirportWeather DTO (atisAvailable=false).
//
// @Summary  METAR-only airport weather
// @Tags     charts
// @Produce  json
// @Security CookieAuth
// @Param    icao path string true "Airport ICAO (e.g. KATL)"
// @Success  200 {object} atis.Report
// @Router   /airports/{icao}/weather [get]
func (s *Server) handleAirportWeather(w http.ResponseWriter, r *http.Request) {
	icao := strings.TrimSpace(chi.URLParam(r, "icao"))
	if icao == "" {
		writeError(w, http.StatusBadRequest, "icao is required")
		return
	}
	metar := s.fetchMetar(r.Context(), icao)
	writeJSON(w, http.StatusOK, atis.MetarOnly(icao, metar))
}
