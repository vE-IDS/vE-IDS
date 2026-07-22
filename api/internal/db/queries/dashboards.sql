-- name: GetDefaultDashboard :one
SELECT * FROM dashboard_layouts
WHERE user_id = $1 AND is_default = true
ORDER BY updated_at DESC
LIMIT 1;

-- name: GetDashboard :one
SELECT * FROM dashboard_layouts WHERE id = $1 AND user_id = $2;

-- name: ListDashboards :many
SELECT * FROM dashboard_layouts WHERE user_id = $1 ORDER BY created_at;

-- name: UpsertDashboard :one
INSERT INTO dashboard_layouts (id, user_id, name, config, is_default)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (id) DO UPDATE SET
    name       = EXCLUDED.name,
    config     = EXCLUDED.config,
    is_default = EXCLUDED.is_default,
    updated_at = now()
RETURNING *;

-- name: DeleteDashboard :exec
DELETE FROM dashboard_layouts WHERE id = $1 AND user_id = $2;
