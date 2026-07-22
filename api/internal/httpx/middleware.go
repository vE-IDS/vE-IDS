package httpx

import (
	"net/http"

	"veids/api/internal/auth"
)

// requireAuth verifies the access-JWT cookie and injects the user into the
// request context. On failure it returns 401 (the SPA then calls /api/auth/refresh
// and retries).
func (s *Server) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie(auth.AccessCookie)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		claims, err := s.jwt.Verify(c.Value)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		u := auth.User{ID: claims.Subject, Cid: claims.Cid, Rating: claims.Rating}
		next.ServeHTTP(w, r.WithContext(auth.WithUser(r.Context(), u)))
	})
}
