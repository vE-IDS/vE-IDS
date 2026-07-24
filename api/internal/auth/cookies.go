package auth

import (
	"net/http"
	"time"
)

// Cookie names.
const (
	AccessCookie     = "veids_at"
	RefreshCookie    = "veids_rt"
	OAuthStateCookie = "veids_oauth_state"

	// refreshPath scopes the refresh cookie so it is only sent to the auth
	// endpoints, limiting its exposure.
	refreshPath = "/api/auth"
)

// CookieManager sets and clears the auth cookies with consistent attributes.
type CookieManager struct {
	secure     bool
	domain     string
	accessTTL  time.Duration
	refreshTTL time.Duration
}

// NewCookieManager builds a CookieManager. secure should be false only in dev
// (so cookies work over plain http://localhost).
func NewCookieManager(secure bool, domain string, accessTTL, refreshTTL time.Duration) *CookieManager {
	return &CookieManager{secure: secure, domain: domain, accessTTL: accessTTL, refreshTTL: refreshTTL}
}

func (m *CookieManager) base(name, value, path string, maxAge int) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     path,
		Domain:   m.domain,
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   m.secure,
		SameSite: http.SameSiteLaxMode,
	}
}

// SetAccess writes the access-JWT cookie (site-wide path).
func (m *CookieManager) SetAccess(w http.ResponseWriter, token string) {
	http.SetCookie(w, m.base(AccessCookie, token, "/", int(m.accessTTL.Seconds())))
}

// SetRefresh writes the refresh-token cookie (scoped to /api/auth).
func (m *CookieManager) SetRefresh(w http.ResponseWriter, token string) {
	http.SetCookie(w, m.base(RefreshCookie, token, refreshPath, int(m.refreshTTL.Seconds())))
}

// SetOAuthState writes the short-lived OAuth CSRF state cookie.
func (m *CookieManager) SetOAuthState(w http.ResponseWriter, state string) {
	http.SetCookie(w, m.base(OAuthStateCookie, state, "/api/auth", int((10*time.Minute).Seconds())))
}

// ClearAuth expires both auth cookies (logout).
func (m *CookieManager) ClearAuth(w http.ResponseWriter) {
	http.SetCookie(w, m.base(AccessCookie, "", "/", -1))
	http.SetCookie(w, m.base(RefreshCookie, "", refreshPath, -1))
}

// ClearOAuthState expires the OAuth state cookie (after callback).
func (m *CookieManager) ClearOAuthState(w http.ResponseWriter) {
	http.SetCookie(w, m.base(OAuthStateCookie, "", "/api/auth", -1))
}
