package httpx

import (
	"net/http"
	"slices"

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

// requirePermission gates a route on a single permission key. It must run after
// requireAuth (which populates the request-context user). Permissions are read
// from the database per request, keeping the access JWT identity-only. Returns
// 401 if unauthenticated, 403 if the user lacks the permission.
func (s *Server) requirePermission(perm string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			u, ok := auth.UserFrom(r.Context())
			if !ok {
				writeError(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			perms, err := s.fetchPerms(r.Context(), u.Cid)
			if err != nil {
				s.logger.Warn("permission lookup failed", "cid", u.Cid, "err", err)
				writeError(w, http.StatusInternalServerError, "could not check permissions")
				return
			}
			if !slices.Contains(perms, perm) {
				writeError(w, http.StatusForbidden, "forbidden")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
