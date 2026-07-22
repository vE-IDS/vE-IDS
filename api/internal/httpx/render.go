// Package httpx is the HTTP transport layer: the chi router, middleware, the
// SPA static server, and all request handlers. Handlers are methods on Server so
// they share the injected dependencies.
package httpx

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

type errorEnvelope struct {
	Error string `json:"error"`
}

// writeJSON serializes v as JSON with the given status.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v != nil {
		if err := json.NewEncoder(w).Encode(v); err != nil {
			slog.Default().Error("write json failed", "err", err)
		}
	}
}

// writeError writes a JSON error envelope with the given status.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, errorEnvelope{Error: msg})
}
