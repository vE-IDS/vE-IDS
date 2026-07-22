// Package auth owns the VATSIM OAuth handshake, JWT issuance/verification, and
// rotating refresh tokens. It has no HTTP dependencies beyond the standard
// library so it can be unit-tested and reused.
package auth

import "context"

type contextKey int

const userKey contextKey = iota

// User is the authenticated principal carried in the request context (populated
// by the auth middleware from the access JWT).
type User struct {
	ID     string // VATSIM CID, used as the user id
	Cid    string
	Rating int
}

// WithUser returns a copy of ctx carrying the authenticated user.
func WithUser(ctx context.Context, u User) context.Context {
	return context.WithValue(ctx, userKey, u)
}

// UserFrom extracts the authenticated user from ctx, if present.
func UserFrom(ctx context.Context) (User, bool) {
	u, ok := ctx.Value(userKey).(User)
	return u, ok
}
