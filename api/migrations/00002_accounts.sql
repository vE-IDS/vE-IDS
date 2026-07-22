-- +goose Up
-- +goose StatementBegin
-- Account: the OAuth account/token linkage for a user (VATSIM Connect). Mirrors
-- the old NextAuth Account table. Tokens are stored for parity; the first slice
-- does not use them after login.
CREATE TABLE accounts (
    user_id             TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type                TEXT        NOT NULL,
    provider            TEXT        NOT NULL,
    provider_account_id TEXT        NOT NULL,
    refresh_token       TEXT,
    access_token        TEXT,
    expires_at          INTEGER,
    token_type          TEXT,
    scopes              TEXT[]      NOT NULL DEFAULT '{}',
    id_token            TEXT,
    session_state       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX idx_accounts_user_id ON accounts (user_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE accounts;
-- +goose StatementEnd
