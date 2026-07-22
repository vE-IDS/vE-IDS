-- name: ListAtisState :many
SELECT * FROM atis_state;

-- name: UpsertAtisState :exec
INSERT INTO atis_state (station, code_letter, raw_report, updated_at)
VALUES ($1, $2, $3, now())
ON CONFLICT (station) DO UPDATE SET
    code_letter = EXCLUDED.code_letter,
    raw_report  = EXCLUDED.raw_report,
    updated_at  = now();
