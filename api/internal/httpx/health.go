package httpx

import (
	"context"
	"net/http"
	"time"
)

// handleHealth reports service + database liveness.
//
// @Summary  Health check
// @Tags     system
// @Produce  json
// @Success  200 {object} map[string]string
// @Failure  503 {object} errorEnvelope
// @Router   /health [get]
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	if err := s.pool.Ping(ctx); err != nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
