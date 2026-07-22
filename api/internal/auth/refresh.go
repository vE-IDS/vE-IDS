package auth

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"veids/api/internal/db/sqlc"
)

// Refresh errors.
var (
	ErrInvalidRefresh = errors.New("invalid refresh token")
	ErrRefreshExpired = errors.New("refresh token expired")
	ErrRefreshReuse   = errors.New("refresh token reuse detected")
)

// RefreshManager issues, rotates, and revokes opaque refresh tokens. Only the
// SHA-256 hash of each token is stored; rotation chains via replaced_by so reuse
// of a revoked token can be detected (and the whole chain revoked).
type RefreshManager struct {
	queries *sqlc.Queries
	ttl     time.Duration
}

// NewRefreshManager builds a RefreshManager with the given refresh-token TTL.
func NewRefreshManager(queries *sqlc.Queries, ttl time.Duration) *RefreshManager {
	return &RefreshManager{queries: queries, ttl: ttl}
}

// Issue creates a new refresh token for a user and returns the plaintext token
// (to be set as a cookie) along with its stored id.
func (m *RefreshManager) Issue(ctx context.Context, userID string) (string, pgtype.UUID, error) {
	plaintext, err := randomToken(32)
	if err != nil {
		return "", pgtype.UUID{}, err
	}
	id := pgtype.UUID{Bytes: uuid.New(), Valid: true}
	_, err = m.queries.CreateRefreshToken(ctx, sqlc.CreateRefreshTokenParams{
		ID:        id,
		UserID:    userID,
		TokenHash: hashToken(plaintext),
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(m.ttl), Valid: true},
	})
	if err != nil {
		return "", pgtype.UUID{}, err
	}
	return plaintext, id, nil
}

// Rotate validates a presented refresh token, revokes it, and issues a fresh
// one. It returns the owning user id and the new plaintext token.
func (m *RefreshManager) Rotate(ctx context.Context, plaintext string) (userID, newToken string, err error) {
	row, err := m.queries.GetRefreshTokenByHash(ctx, hashToken(plaintext))
	if err != nil {
		return "", "", ErrInvalidRefresh
	}
	if row.RevokedAt.Valid {
		// A revoked token was replayed: treat as theft and revoke the chain.
		_ = m.queries.RevokeAllUserRefreshTokens(ctx, row.UserID)
		return "", "", ErrRefreshReuse
	}
	if row.ExpiresAt.Valid && row.ExpiresAt.Time.Before(time.Now()) {
		return "", "", ErrRefreshExpired
	}

	newPlain, newID, err := m.Issue(ctx, row.UserID)
	if err != nil {
		return "", "", err
	}
	if err := m.queries.RevokeRefreshToken(ctx, sqlc.RevokeRefreshTokenParams{ID: row.ID, ReplacedBy: newID}); err != nil {
		return "", "", err
	}
	return row.UserID, newPlain, nil
}

// Revoke invalidates a single refresh token (logout). A missing token is a no-op.
func (m *RefreshManager) Revoke(ctx context.Context, plaintext string) error {
	row, err := m.queries.GetRefreshTokenByHash(ctx, hashToken(plaintext))
	if err != nil {
		return nil
	}
	return m.queries.RevokeRefreshToken(ctx, sqlc.RevokeRefreshTokenParams{ID: row.ID})
}
