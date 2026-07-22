package httpx

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"veids/api/internal/auth"
	"veids/api/internal/db/sqlc"
)

// handleLogin starts the VATSIM OAuth flow: set a CSRF state cookie and redirect
// to the VATSIM consent screen.
func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	state, err := auth.NewState()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not start login")
		return
	}
	s.cookies.SetOAuthState(w, state)
	http.Redirect(w, r, s.oauth.AuthorizeURL(state), http.StatusFound)
}

// handleCallback completes the OAuth flow: validate state, exchange the code,
// fetch the profile, upsert the user, issue our JWT + refresh, and redirect to
// the SPA.
func (s *Server) handleCallback(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()

	stateCookie, err := r.Cookie(auth.OAuthStateCookie)
	if err != nil || q.Get("state") == "" || q.Get("state") != stateCookie.Value {
		writeError(w, http.StatusBadRequest, "invalid oauth state")
		return
	}
	s.cookies.ClearOAuthState(w)

	code := q.Get("code")
	if code == "" {
		writeError(w, http.StatusBadRequest, "missing authorization code")
		return
	}

	tok, err := s.oauth.Exchange(ctx, code)
	if err != nil {
		s.logger.Warn("oauth exchange failed", "err", err)
		writeError(w, http.StatusBadGateway, "vatsim token exchange failed")
		return
	}
	profile, err := s.oauth.UserInfo(ctx, tok.AccessToken)
	if err != nil {
		s.logger.Warn("oauth userinfo failed", "err", err)
		writeError(w, http.StatusBadGateway, "vatsim profile fetch failed")
		return
	}

	cid := profile.Data.Cid
	user, err := s.queries.UpsertUser(ctx, sqlc.UpsertUserParams{
		ID:        cid,
		Cid:       cid,
		FirstName: profile.Data.Personal.NameFirst,
		LastName:  profile.Data.Personal.NameLast,
		Email:     profile.Data.Personal.Email,
		Rating:    int32(profile.Data.Vatsim.Rating.ID),
	})
	if err != nil {
		s.logger.Error("upsert user failed", "err", err)
		writeError(w, http.StatusInternalServerError, "could not persist user")
		return
	}

	// Persist the OAuth account/tokens for parity (unused after login in v1).
	var expiresAt pgtype.Int4
	if tok.ExpiresIn > 0 {
		expiresAt = pgtype.Int4{Int32: int32(time.Now().Add(time.Duration(tok.ExpiresIn) * time.Second).Unix()), Valid: true}
	}
	_ = s.queries.UpsertAccount(ctx, sqlc.UpsertAccountParams{
		UserID:            user.ID,
		Type:              "oauth",
		Provider:          "vatsim",
		ProviderAccountID: cid,
		RefreshToken:      pgtype.Text{String: tok.RefreshToken, Valid: tok.RefreshToken != ""},
		AccessToken:       pgtype.Text{String: tok.AccessToken, Valid: tok.AccessToken != ""},
		ExpiresAt:         expiresAt,
		TokenType:         pgtype.Text{String: tok.TokenType, Valid: tok.TokenType != ""},
		Scopes:            splitScopes(tok.Scope),
	})

	if err := s.issueSession(ctx, w, user); err != nil {
		writeError(w, http.StatusInternalServerError, "could not create session")
		return
	}

	http.Redirect(w, r, "/", http.StatusFound)
}

// handleRefresh rotates the refresh token and mints a new access JWT.
func (s *Server) handleRefresh(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	c, err := r.Cookie(auth.RefreshCookie)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "no refresh token")
		return
	}
	userID, newRT, err := s.refresh.Rotate(ctx, c.Value)
	if err != nil {
		s.cookies.ClearAuth(w)
		writeError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}
	user, err := s.queries.GetUserByID(ctx, userID)
	if err != nil {
		s.cookies.ClearAuth(w)
		writeError(w, http.StatusUnauthorized, "unknown user")
		return
	}
	at, err := s.jwt.Issue(user.ID, user.Cid, int(user.Rating))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not issue token")
		return
	}
	s.cookies.SetAccess(w, at)
	s.cookies.SetRefresh(w, newRT)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// handleMe returns the authenticated user's profile.
func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	u, _ := auth.UserFrom(r.Context())
	user, err := s.queries.GetUserByID(r.Context(), u.ID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unknown user")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"id":        user.ID,
		"cid":       user.Cid,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"email":     user.Email,
		"rating":    user.Rating,
	})
}

// handleLogout revokes the refresh token and clears the cookies.
func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(auth.RefreshCookie); err == nil {
		_ = s.refresh.Revoke(r.Context(), c.Value)
	}
	s.cookies.ClearAuth(w)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// issueSession mints and sets the access + refresh cookies for a user.
func (s *Server) issueSession(ctx context.Context, w http.ResponseWriter, user sqlc.User) error {
	at, err := s.jwt.Issue(user.ID, user.Cid, int(user.Rating))
	if err != nil {
		return err
	}
	rt, _, err := s.refresh.Issue(ctx, user.ID)
	if err != nil {
		return err
	}
	s.cookies.SetAccess(w, at)
	s.cookies.SetRefresh(w, rt)
	return nil
}

func splitScopes(scope string) []string {
	out := []string{}
	for _, s := range strings.Fields(scope) {
		out = append(out, s)
	}
	return out
}
