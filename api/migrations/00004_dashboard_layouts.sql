-- +goose Up
-- +goose StatementBegin
-- A user's saved IDS dashboard. `config` stores a serialized DashboardConfig
-- (see frontend/src/types/dashboard.type.ts). A user may have multiple named
-- dashboards; exactly one is marked is_default and loaded on /ids.
CREATE TABLE dashboard_layouts (
    id         TEXT PRIMARY KEY,
    user_id    TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name       TEXT        NOT NULL DEFAULT 'Default',
    config     JSONB       NOT NULL,
    is_default BOOLEAN     NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dashboard_layouts_user_id ON dashboard_layouts (user_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE dashboard_layouts;
-- +goose StatementEnd
