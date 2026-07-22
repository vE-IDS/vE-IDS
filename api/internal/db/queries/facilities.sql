-- name: ListFacilities :many
SELECT * FROM facilities ORDER BY id;

-- name: GetFacility :one
SELECT * FROM facilities WHERE id = $1;

-- name: UpsertFacility :exec
-- Called by the VATUSA syncer. Core fields are columns; `metadata` carries the
-- staff CIDs (and any future per-facility values) as a JSONB bag.
INSERT INTO facilities (id, name, url, region, active, metadata, synced_at)
VALUES ($1, $2, $3, $4, $5, $6, now())
ON CONFLICT (id) DO UPDATE SET
    name      = EXCLUDED.name,
    url       = EXCLUDED.url,
    region    = EXCLUDED.region,
    active    = EXCLUDED.active,
    metadata  = EXCLUDED.metadata,
    synced_at = now(),
    updated_at = now();

-- name: DeleteGrantsBySource :exec
-- The syncer wipes all grants from a given source (e.g. 'vatusa') before
-- reinserting the fresh set, leaving grants from other sources (e.g. 'manual')
-- untouched. Run inside the same transaction as the reinserts.
DELETE FROM user_facility_roles WHERE source = $1;

-- name: InsertGrant :exec
INSERT INTO user_facility_roles (cid, facility_id, role_key, source, granted_by)
VALUES ($1, $2, $3, $4, $5);

-- name: GetUserPermissions :many
-- The distinct set of permission keys a controller holds, unioned across every
-- role granted to their CID at any facility.
SELECT DISTINCT rp.permission_key
FROM user_facility_roles ufr
JOIN role_permissions rp ON rp.role_key = ufr.role_key
WHERE ufr.cid = $1
ORDER BY rp.permission_key;

-- name: GetUserFacilityRoles :many
-- Every (facility, role) a controller holds, with the facility's display fields.
-- LEFT JOIN so system-wide grants (facility_id IS NULL) still return.
SELECT
    ufr.facility_id,
    ufr.role_key,
    ufr.source,
    f.name     AS facility_name,
    f.url      AS facility_url,
    f.region   AS facility_region,
    f.active   AS facility_active,
    f.metadata AS facility_metadata
FROM user_facility_roles ufr
LEFT JOIN facilities f ON f.id = ufr.facility_id
WHERE ufr.cid = $1
ORDER BY ufr.facility_id, ufr.role_key;
