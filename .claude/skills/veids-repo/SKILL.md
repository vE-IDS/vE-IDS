---
name: veids-repo
description: How the vE-IDS repo works — the Go API + React SPA split, where data comes from, and how to add features. Use this whenever working anywhere in the vE-IDS repo: adding or changing database migrations, REST endpoints, dashboard panels, the WebSocket, ATIS/METAR parsing, or auth — even for a small change, and even if the repo isn't named explicitly but the paths (api/, frontend/) make it clear.
---

# Working in the vE-IDS repo

vE-IDS is a VATSIM controller IDS, split into a **Go API** (`api/`, the source of
truth) and a **React SPA** (`frontend/`). It was migrated from a Next.js monolith
still available at `../ve-ids-old`.

> **All paths below are relative to the repo root.** `docs/architecture.md` means
> `<repo-root>/docs/architecture.md`. Resolve paths from the root, not from this file.

**Read first:** `docs/architecture.md`, then this file for day-to-day patterns.
`docs/NOT-DONE.md` lists what isn't built yet — check it before assuming something
exists.

**On the old repo:** when unsure what a feature is *supposed* to do, read
`../ve-ids-old` (its `docs/` and components are accurate) — but for *intended
behavior only*. Do not port its implementation shape. The architecture deliberately
differs: the Go API now owns all upstream fetching and auth moved to httpOnly
cookies. Copying monolith patterns will fight the current design.

## The golden rule: where data comes from

- **The Go API owns all upstream fetching.** The browser NEVER calls VATSIM,
  aviationweather, or AviationAPI directly. Typed clients live in
  `api/internal/vatsim/`.
- **Live data → WebSocket.** Only two things stream over `/api/ws`: datafeed
  updates and ATIS updates (pushed only when an ATIS changes). See
  `docs/websocket.md`.
- **Everything else → REST** under `/api/*`, consumed via `frontend/src/lib/api.ts`.
- **Auth → httpOnly cookies** (access JWT + rotating refresh). See `docs/auth.md`.
  The SPA never reads tokens; it sends `credentials: 'include'` and lets a 401
  trigger a refresh+retry.
- Single origin in prod: the Go binary serves the SPA at `/*` and the API at
  `/api/*`. Keep the SPA on **relative** `/api` paths — no hardcoded hosts.

## Two things that will surprise you

Read these once; they cause the most wasted time.

1. **`sqlc` reads your migrations as the schema.** There is no separate schema
   file. After any change to `api/migrations/`, run `make sqlc` or the generated
   models in `internal/db/sqlc/` will be stale and won't match the DB.
2. **`atisParser.ts` is a hand-maintained copy of the Go parser.** There is no
   shared codegen between `api/internal/parser` and `frontend/src/lib/atisParser.ts`.
   If you change parsing output shape, change both. Don't "fix" the duplication by
   deleting one side. The two are kept honest by a golden-fixture test — see
   "Keeping the parser copies in sync" below.

## Plan the slice before you write code

Most changes here are *vertical*: one concern that cuts through several layers. Before
writing anything that touches data, write the slice down and confirm it's a single
concern:

```
migration → query (.sql) → make sqlc → handler (httpx) → api.ts consumer → panel
```

If your change spans two concerns (e.g. a schema migration AND unrelated UI), it's two
slices and two PRs. Deciding this up front prevents the half-migrated state where
`sqlc` output and handlers have drifted from the schema. This is a design rule, not
just a merge policy (see "PR structure").

## Common changes

### Add a REST endpoint
1. If it needs new data access, add SQL to `api/internal/db/queries/*.sql` and run
   `make sqlc` (regenerates `internal/db/sqlc/` — never edit generated files).
2. Add a handler method on `*Server` in `api/internal/httpx/` and mount it in
   `server.go`: inside the `requireAuth` group if it needs a user, outside it for a
   public endpoint.
3. Use `writeJSON`/`writeError`; read the user with `auth.UserFrom(ctx)`.
4. **Add a handler test.** `httpx` handlers get a table test covering at least: the
   happy path, the auth case (401 when it should require a user), and one
   `writeError` path. Auth-group mistakes and error-shape drift are the most common
   bugs here, and only a handler test catches them.
5. Consume it from the SPA via `apiFetch` in `frontend/src/lib/api.ts`.

### Add a database migration
1. Create `api/migrations/NNNNN_name.sql` with `-- +goose Up` / `-- +goose Down`
   blocks (keep the numeric prefix ordered). Migrations are embedded and run on
   boot. **Write the `Down` block for real** — it's your only rollback, and on the
   Aurora instance a `Down` that's never exercised is a rollback that doesn't exist.
   CI runs up→down→up on a throwaway Postgres, so a broken `Down` fails the build.
2. `make sqlc` after changing schema (see "Two things that will surprise you").
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
The parser output shape is contracted in `docs/parser-contract.md` — update it in the
same change, since it's the one thing both implementations must agree on.
1. Edit `api/internal/parser` and update `parser_test.go`. `parser` is pure and must
   stay fully tested.
2. Mirror any output-shape change in `frontend/src/lib/atisParser.ts`.
3. Update the golden fixtures (below) so the sync test reflects the new shape.

## Keeping the parser copies in sync

Because `api/internal/parser` and `frontend/src/lib/atisParser.ts` are two hand-written
implementations of the same contract, drift is the repo's main structural risk. It's
caught by a golden-fixture test: the Go tests emit a set of ATIS/METAR inputs→outputs
as JSON fixtures, and a frontend test asserts `atisParser.ts` produces byte-identical
JSON for the same inputs. When you change parsing, regenerate the fixtures and both
sides' tests must stay green — divergence becomes a red build instead of a runtime bug.

## Layout & dependency rule (reference)

`api/internal/httpx` (transport) → domain (`auth`, `feed`, `atis`, `db/sqlc`) →
(`vatsim`, `parser`). Nothing in a domain package imports `httpx`. `parser` is pure
and must stay tested.

## Build / test / run

- `make dev` — full stack in Docker (Postgres + API hot-reload + Vite). SPA at
  :3000, API at :8080.
- `make build` — the production single image (SPA embedded in the Go binary).

**The green gate — run all of this before pushing, all must pass:**
```
cd api && go vet ./... && go build ./... && go test ./...
cd ../frontend && pnpm build     # strict TS; emits dist/
```

## Frontend / UI work

- **Design with the `frontend-design` skill.** For any non-trivial UI (new
  components, cards, layouts, restyles), invoke the `frontend-design` skill first
  and make deliberate, subject-specific choices — this is an aviation ops display,
  so lean into the vernacular (flight-category color, coded METAR/ATIS text,
  runway identifiers). The card system's rule of thumb: **identity/labels in Inter,
  coded data (wind, altimeter, METAR, runways) in monospace**, with the
  flight-category color block as the single accent. Old-IDS palette + Inter live in
  `frontend/src/styles.css`.
- **Look at it with Playwright.** Don't guess at layout/spacing — drive the running
  app (Vite on :3000) and screenshot. Use `browser_snapshot` for element refs and
  actions, `browser_take_screenshot` (element `target` + `scale: "device"`) to
  inspect a component up close, then Read the PNG.
- **Reaching the authed IDS** (`/ids/*` is behind VATSIM login, which you can't
  complete headless): mint a JWT with the running API's `JWT_SIGNING_KEY` (claims
  `sub`/`cid` = an existing `users.id`, `rat`, `iss=veids`, `aud=veids-spa`) and set
  it as the `veids_at` cookie via `browser_evaluate('document.cookie = ...')` on the
  `:3000` origin — the server reads the cookie regardless of the httpOnly flag. The
  ATIS WebSocket only carries **currently-online** stations, so add a live one
  (check the datafeed) to see a populated card. Screenshot artifacts and
  `frontend/.playwright-mcp/` are gitignored — don't commit them.

## Documentation

Docs are treated as source of truth, not an afterthought:
- Update the relevant `docs/` page in the **same PR** as the change.
- `docs/parser-contract.md` is the canonical description of the parser output shape;
  both `parser_test.go` and `atisParser.ts` point at it. Keep it current with any
  shape change.
- `docs/NOT-DONE.md` is a live ledger. Finishing something means *removing* its line
  in the same PR — that deletion is a useful review signal. Leaving something
  unfinished means *adding* a line.

## PR structure

Keep each PR to **one vertical concern** (see "Plan the slice before you write code"),
and include the whole vertical together so it's reviewable and revertible:

- A feature that needs data + endpoint + UI → migration + `sqlc` + handler + handler
  test + the SPA consumer in one PR.
- Separate PRs for: a new panel, a new upstream source, an auth change, an infra
  change. Don't mix a schema migration with unrelated UI.
- Always: the green gate passes and the relevant `docs/` page is updated in the same
  PR.
- Never edit generated code (`internal/db/sqlc/`, `frontend/src/routeTree.gen.ts`).
- Never commit secrets; `.env` is gitignored (`.env.example` documents the vars).