-- name: UpsertAccount :exec
INSERT INTO accounts (
    user_id, type, provider, provider_account_id,
    refresh_token, access_token, expires_at, token_type, scopes, id_token, session_state
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
ON CONFLICT (provider, provider_account_id) DO UPDATE SET
    user_id       = EXCLUDED.user_id,
    refresh_token = EXCLUDED.refresh_token,
    access_token  = EXCLUDED.access_token,
    expires_at    = EXCLUDED.expires_at,
    token_type    = EXCLUDED.token_type,
    scopes        = EXCLUDED.scopes,
    id_token      = EXCLUDED.id_token,
    session_state = EXCLUDED.session_state,
    updated_at    = now();
