-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: UpsertUser :one
-- The VATSIM CID is used as the user id (stable, text PK).
INSERT INTO users (id, cid, first_name, last_name, email, rating)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (id) DO UPDATE SET
    cid        = EXCLUDED.cid,
    first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    email      = EXCLUDED.email,
    rating     = EXCLUDED.rating,
    updated_at = now()
RETURNING *;
