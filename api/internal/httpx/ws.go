package httpx

import (
	"net/http"
	"net/url"

	"github.com/coder/websocket"

	"veids/api/internal/auth"
)

// handleWS upgrades the connection (auth already verified by requireAuth),
// registers the client with the hub, and streams it the initial snapshot + live
// updates until it disconnects.
func (s *Server) handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket.Accept(w, r, s.wsAcceptOptions())
	if err != nil {
		s.logger.Warn("ws accept failed", "err", err)
		return
	}

	u, _ := auth.UserFrom(r.Context())
	initial, err := s.store.SnapshotMessage()
	if err != nil {
		s.logger.Warn("build snapshot failed", "err", err)
		initial = nil
	}
	s.hub.Serve(r.Context(), conn, u.ID, initial)
}

// wsAcceptOptions locks the WS origin to the app origin (CSRF defense). Dev
// allows any origin so the Vite dev server (:3000) can connect through its proxy.
func (s *Server) wsAcceptOptions() *websocket.AcceptOptions {
	if s.cfg.IsDev() {
		return &websocket.AcceptOptions{OriginPatterns: []string{"*"}}
	}
	opts := &websocket.AcceptOptions{}
	if u, err := url.Parse(s.cfg.AppBaseURL); err == nil && u.Host != "" {
		opts.OriginPatterns = []string{u.Host}
	}
	return opts
}
