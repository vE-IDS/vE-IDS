-- name: UpsertPermission :exec
INSERT INTO permissions (key, name, description)
VALUES ($1, $2, $3)
ON CONFLICT (key) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description;

-- name: UpsertRole :exec
INSERT INTO roles (key, name, description)
VALUES ($1, $2, $3)
ON CONFLICT (key) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description;

-- name: UpsertRolePermission :exec
INSERT INTO role_permissions (role_key, permission_key)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;
