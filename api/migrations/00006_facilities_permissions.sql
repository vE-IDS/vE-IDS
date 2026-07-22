-- +goose Up
-- +goose StatementBegin
-- Facility: a VATUSA ARTCC, synced from api.vatusa.net. Core fields are columns;
-- `metadata` is an extensible JSONB bag (VATUSA staff CIDs today, arbitrary
-- per-facility config later) so new per-facility values can be attached without a
-- migration. `id` is the ARTCC IATA id (e.g. 'ZJX'); text PK like the rest of the
-- schema so legacy rows can be imported.
CREATE TABLE facilities (
    id         TEXT PRIMARY KEY,
    name       TEXT        NOT NULL,
    url        TEXT        NOT NULL DEFAULT '',
    region     INTEGER     NOT NULL DEFAULT 0,
    type       TEXT        NOT NULL DEFAULT 'artcc',
    active     BOOLEAN     NOT NULL DEFAULT true,
    metadata   JSONB       NOT NULL DEFAULT '{}',
    synced_at  TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permission: a fine-grained capability. Definitions are seeded on every boot
-- (see internal/db/seed) so the set is modular and self-healing.
CREATE TABLE permissions (
    key         TEXT PRIMARY KEY,
    name        TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role: a named bundle of permissions. Maps VATUSA staff positions (ATM, DATM,
-- TA, FE, FACCBT) plus manual roles (e.g. system.admin). Also seeded on boot.
CREATE TABLE roles (
    key         TEXT PRIMARY KEY,
    name        TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- role_permissions: which permissions each role grants.
CREATE TABLE role_permissions (
    role_key       TEXT NOT NULL REFERENCES roles (key) ON DELETE CASCADE,
    permission_key TEXT NOT NULL REFERENCES permissions (key) ON DELETE CASCADE,
    PRIMARY KEY (role_key, permission_key)
);

-- user_facility_roles: a grant of a role to a controller (by CID) at a facility.
-- Keyed on `cid` rather than a FK to users(id) so staff who have never logged in
-- to vE-IDS can be granted access ahead of time; the grant activates on their
-- first login (their CID = users.id). `facility_id` NULL means a system-wide grant.
-- `source` distinguishes VATUSA-synced grants (reconciled every sync) from manual
-- grants (preserved across syncs).
CREATE TABLE user_facility_roles (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cid         TEXT        NOT NULL,
    facility_id TEXT        REFERENCES facilities (id) ON DELETE CASCADE,
    role_key    TEXT        NOT NULL REFERENCES roles (key) ON DELETE CASCADE,
    source      TEXT        NOT NULL DEFAULT 'vatusa',
    granted_by  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_facility_roles_cid ON user_facility_roles (cid);

-- Uniqueness: one grant per (cid, facility, role, source). Facility-scoped grants
-- and system-wide grants (facility_id IS NULL) are deduplicated separately because
-- Postgres treats NULLs as distinct in a plain UNIQUE constraint.
CREATE UNIQUE INDEX uq_ufr_facility ON user_facility_roles (cid, facility_id, role_key, source)
    WHERE facility_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ufr_system ON user_facility_roles (cid, role_key, source)
    WHERE facility_id IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE user_facility_roles;
DROP TABLE role_permissions;
DROP TABLE roles;
DROP TABLE permissions;
DROP TABLE facilities;
-- +goose StatementEnd
