-- +goose Up
-- +goose StatementBegin
-- User: a VATSIM identity, populated from the VATSIM Connect profile on login.
-- `id` is kept as text (the old app used a cuid) so existing rows can be imported.
CREATE TABLE users (
    id             TEXT PRIMARY KEY,
    cid            TEXT        NOT NULL,
    first_name     TEXT        NOT NULL,
    last_name      TEXT        NOT NULL,
    email          TEXT        NOT NULL UNIQUE,
    email_verified TIMESTAMPTZ,
    rating         INTEGER     NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_cid ON users (cid);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE users;
-- +goose StatementEnd
