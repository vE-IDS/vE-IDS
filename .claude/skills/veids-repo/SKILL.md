---
name: veids-repo
description: How the vE-IDS repo works — the Go API + React SPA split, where data comes from, and how to add features. Read this before working in this repo (migrations, endpoints, panels, the WebSocket, or auth).
---

# Working in the vE-IDS repo

vE-IDS is a VATSIM controller IDS, split into a **Go API** (`api/`, the source of
truth) and a **React SPA** (`frontend/`). It was migrated from a Next.js monolith
still available at `../ve-ids-old` — when in doubt about intended behavior, read
the original there (its `docs/` and components are accurate).

**Read first:** [`docs/architecture.md`](../../../docs/architecture.md). Then this
file for the day-to-day patterns. [`docs/NOT-DONE.md`](../../../docs/NOT-DONE.md)
lists what isn't built yet — check it before assuming something exists.

## The golden rule: where data comes from

- **The Go API owns all upstream fetching.** The browser NEVER calls VATSIM,
  aviationweather, or AviationAPI directly. Typed clients live in
  `api/internal/vatsim/`.
- **Live data → WebSocket.** Only two things stream over `/api/ws`: datafeed
  updates and ATIS updates (pushed only when an ATIS changes). See
  [`docs/websocket.md`](../../../docs/websocket.md).
- **Everything else → REST** under `/api/*`, consumed via `frontend/src/lib/api.ts`.
- **Auth → httpOnly cookies** (access JWT + rotating refresh). See
  [`docs/auth.md`](../../../docs/auth.md). The SPA never reads tokens; it sends
  `credentials: 'include'` and lets a 401 trigger a refresh+retry.
- Single origin in prod: the Go binary serves the SPA at `/*` and the API at
  `/api/*`. Keep the SPA on **relative** `/api` paths — no hardcoded hosts.

## Layout & dependency rule

`api/internal/httpx` (transport) → domain (`auth`, `feed`, `atis`, `db/sqlc`) →
(`vatsim`, `parser`). Nothing in a domain package imports `httpx`. `parser` is pure
and must stay tested.

## Common changes

### Add a REST endpoint
1. If it needs new data access, add SQL to `api/internal/db/queries/*.sql` and run
   `make sqlc` (regenerates `internal/db/sqlc/` — never edit generated files).
2. Add a handler method on `*Server` in `api/internal/httpx/` and mount it in
   `server.go` (inside the `requireAuth` group if it needs a user).
3. Use `writeJSON`/`writeError`; read the user with `auth.UserFrom(ctx)`.
4. Consume it from the SPA via `apiFetch` in `frontend/src/lib/api.ts`.

### Add a database migration
1. Create `api/migrations/NNNNN_name.sql` with `-- +goose Up` / `-- +goose Down`
   blocks (keep the numeric prefix ordered). Migrations are embedded and run on
   boot; `sqlc` also reads them as the schema.
2. `make sqlc` after changing schema so generated models stay in sync.
3. Locally: `make migrate` (needs `$DATABASE_URL`), or just restart the API.

### Add a dashboard panel (frontend)
Same pattern as the old app: (1) extend `PanelType` in
`frontend/src/types/dashboard.type.ts`, (2) add it to `PANEL_TYPES` in
`src/lib/dashboard.ts`, (3) add one entry to `src/components/panels/registry.tsx`.
Panels render content only; shared `Panel` chrome adds the title bar/drag handle.

### Add a live data stream
Extend the poller (`api/internal/feed/poller.go`) and add a message type in
`protocol.go`; broadcast via the hub. Only add to the WS if it's genuinely live —
otherwise make it REST.

### Change ATIS/METAR parsing
Edit `api/internal/parser`, update `parser_test.go`, and mirror any shape change in
the `frontend/src/lib/atisParser.ts` copy.

## Build / test / run

- `make dev` — full stack in Docker (Postgres + API hot-reload + Vite). SPA at
  :3000, API at :8080.
- `make test` — Go tests. `cd api && go vet ./... && go build ./...` before pushing.
- `make build` — the production single image (SPA embedded in the Go binary).
- Frontend: `cd frontend && pnpm build` must succeed (strict TS; emits `dist/`).

## PR structure

Keep each PR to **one vertical concern**, and include the whole vertical together
so it's reviewable and revertible:

- A feature that needs data + endpoint + UI → migration + `sqlc` + handler + the
  SPA consumer in one PR.
- Separate PRs for: a new panel, a new upstream source, an auth change, an infra
  change. Don't mix a schema migration with unrelated UI.
- Always: `go vet`/`go build`/`go test` green and `pnpm build` green. Update the
  relevant `docs/` page in the same PR. If you intentionally leave something
  unfinished, add it to `docs/NOT-DONE.md`.
- Never edit generated code (`internal/db/sqlc/`, `frontend/src/routeTree.gen.ts`).
- Never commit secrets; `.env` is gitignored (`.env.example` documents the vars).
