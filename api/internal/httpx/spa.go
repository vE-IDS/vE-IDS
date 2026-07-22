package httpx

import (
	"io"
	"net/http"
	"strings"
)

// spaHandler serves the embedded static SPA with an index.html fallback for
// client-side routes. /api/* is mounted before this, so API requests never reach
// here. In dev (static == nil) the SPA is served by Vite instead.
func (s *Server) spaHandler() http.Handler {
	if s.static == nil {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "SPA is served by Vite in dev at http://localhost:3000", http.StatusNotFound)
		})
	}

	fileServer := http.FileServer(http.FS(s.static))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := strings.TrimPrefix(r.URL.Path, "/")
		if p == "" {
			s.serveIndex(w)
			return
		}
		f, err := s.static.Open(p)
		if err != nil {
			// Unknown path → SPA route; serve index.html.
			s.serveIndex(w)
			return
		}
		_ = f.Close()
		if strings.HasPrefix(r.URL.Path, "/assets/") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}
		fileServer.ServeHTTP(w, r)
	})
}

func (s *Server) serveIndex(w http.ResponseWriter) {
	f, err := s.static.Open("index.html")
	if err != nil {
		http.Error(w, "index.html not found", http.StatusInternalServerError)
		return
	}
	defer f.Close()
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, f)
}
