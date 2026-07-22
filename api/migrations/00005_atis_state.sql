-- +goose Up
-- +goose StatementBegin
-- Last-known ATIS per station. Persisted on every code-letter change so the
-- feed poller can seed its in-memory change-detection map on restart (and avoid
-- re-broadcasting every station on boot). `raw_report` is the serialized
-- ATISReport the WebSocket last pushed for the station.
CREATE TABLE atis_state (
    station     TEXT PRIMARY KEY,
    code_letter TEXT,
    raw_report  JSONB       NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE atis_state;
-- +goose StatementEnd
