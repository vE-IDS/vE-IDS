-- +goose Up
-- +goose StatementBegin
-- Refresh tokens for the rotating-refresh JWT scheme. Replaces the old NextAuth
-- database `Session` table (access tokens are now stateless JWTs). Only the
-- SHA-256 hash of the opaque token is stored; `replaced_by` chains rotations so
-- reuse of a revoked token can be detected (theft signal).
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY,
    user_id     TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    replaced_by UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE refresh_tokens;
-- +goose StatementEnd
