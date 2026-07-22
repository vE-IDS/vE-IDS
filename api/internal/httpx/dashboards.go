package httpx

import (
	"encoding/json"
	"io"
	"net/http"

	"veids/api/internal/auth"
	"veids/api/internal/db/sqlc"
)

// handleGetDefaultDashboard returns the user's stored default dashboard config
// (opaque JSON). 404 when none exists — the SPA then falls back to its bundled
// default layout. (Full multi-dashboard CRUD is deferred; see docs/NOT-DONE.md.)
func (s *Server) handleGetDefaultDashboard(w http.ResponseWriter, r *http.Request) {
	u, _ := auth.UserFrom(r.Context())
	row, err := s.queries.GetDefaultDashboard(r.Context(), u.ID)
	if err != nil {
		writeError(w, http.StatusNotFound, "no saved dashboard")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(row.Config)
}

// handlePutDefaultDashboard upserts the user's default dashboard. The config is
// stored as opaque JSONB; structural validation lives on the client for now.
func (s *Server) handlePutDefaultDashboard(w http.ResponseWriter, r *http.Request) {
	u, _ := auth.UserFrom(r.Context())
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, "could not read body")
		return
	}
	if !json.Valid(body) {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	if _, err := s.queries.UpsertDashboard(r.Context(), sqlc.UpsertDashboardParams{
		ID:        "dash-" + u.ID,
		UserID:    u.ID,
		Name:      "Default",
		Config:    body,
		IsDefault: true,
	}); err != nil {
		s.logger.Error("upsert dashboard failed", "err", err)
		writeError(w, http.StatusInternalServerError, "could not save dashboard")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}
