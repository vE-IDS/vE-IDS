# Architecture

vE-IDS is two services: a **Go API** (source of truth) and a **React SPA**. This
is a decoupling of the original Next.js monolith (`../ve-ids-old`), whose design
is preserved where it still applies (the ATIS parser, the dashboard panel
contract, the data sources) and re-architected where the split demands it (auth,
and live data delivery over a WebSocket instead of client polling).

## Topology

```
                         ┌───────────────────────────────────────────┐
                         │                  Browser                    │
                         │   React SPA (TanStack Router + Query)       │
                         │   REST via fetch · live via one WebSocket   │
                         └───────────────┬─────────────────────────────┘
                          /api/* , /api/ws │      /* (prod: static SPA)
                         ┌────────────────▼─────────────────────────────┐
                         │                  Go API (chi)                 │
                         │  httpx: REST handlers + auth mw + SPA server  │
                         │  auth: VATSIM OAuth → JWT + refresh rotation  │
                         │  feed: 15s poller → hub → WS clients          │
                         └───┬───────────────┬───────────────┬───────────┘
                  Postgres ◀─┘   VATSIM feed ◀┘   aviationweather / AviationAPI
             (users, dashboards, refresh_tokens, atis_state)
```

## The Go API (`api/`)

Layered so transport depends on domain, domain depends on data/clients, and the
pure pieces depend on nothing:

```
cmd/veids/main.go          composition root: config → pool → migrate → poller+hub → http server → graceful shutdown
internal/config            env → Config (12-factor)
internal/db                pgxpool, embedded goose migrations, sqlc-generated queries
internal/auth              VATSIM OAuth client, JWT, rotating refresh tokens, cookies, request-context user
internal/vatsim            typed clients for the datafeed, METARs, AviationAPI charts
internal/parser            pure ATIS/METAR text parser (ported from the old app) + golden tests
internal/atis              assembles per-airport ATIS Reports from the feed + METARs
internal/feed              the single datafeed poller, the in-memory store, and the WebSocket hub
internal/httpx             chi router, middleware, handlers, SPA static server
migrations                 goose SQL (embedded)
web                        //go:embed of the built SPA (prod)
```

**Dependency rule:** `httpx` → (`auth`, `feed`, `atis`, `db/sqlc`) → (`vatsim`,
`parser`). Nothing in a domain package imports `httpx`. `parser` is pure and
unit-tested; `vatsim` only decodes upstream payloads into typed structs.

### Data access

Postgres via **pgx** with **sqlc** for type-safe queries (hand-written SQL in
`internal/db/queries/*.sql`, generated code in `internal/db/sqlc/` — never edit
the generated code). Migrations are **goose** files under `migrations/`, embedded
into the binary and run on boot (`internal/db/migrate.go`). See
[the schema](#database) below.

### Live data: poller + hub

A single goroutine (`internal/feed/poller.go`) polls the VATSIM datafeed every
15s. Each tick it:

1. Skips if the feed's `update_timestamp` is unchanged.
2. Projects the feed to a slim `DatafeedProjection` (the raw feed is multiple MB)
   and broadcasts it to all WebSocket clients.
3. Builds per-airport ATIS `Report`s (`internal/atis`) — filtering the feed's
   `atis[]` by ICAO, merging split `_A_`/`_D_` positions, and deriving
   wind/altimeter/flight-category preferring the parsed METAR then the ATIS text.
4. **Detects ATIS changes**: compares each station's code letter to the last one
   seen (`internal/feed/store.go`) and broadcasts **only the changed stations**.
   Changes are persisted to `atis_state` so a restart doesn't re-broadcast
   everything.

The hub (`internal/feed/hub.go`) owns the client set in a single goroutine and
fans out pre-marshaled JSON. New clients get a `snapshot` immediately on connect.
Full protocol: [websocket.md](websocket.md).

### Auth

The Go service owns the entire VATSIM OAuth handshake and issues its **own** JWT
(it does not proxy VATSIM tokens to the browser). Access JWT + rotating refresh
token are set as Secure, httpOnly, SameSite=Lax cookies. Full flow:
[auth.md](auth.md).

### Serving the SPA

In production the built SPA is embedded (`web/embed.go`) and served by
`internal/httpx/spa.go` with an `index.html` fallback for client routes. `/api`
is mounted first so API requests never hit the fallback. In development the SPA is
served by Vite instead (the API sees `ENV=dev` and skips static serving).

## The SPA (`frontend/`)

TanStack Router (file-based routes) + TanStack Query + Tailwind v4, built by Vite
to static files. It talks to the API over relative paths:

- **REST** via `src/lib/api.ts` — `credentials: 'include'`; on a 401 it calls
  `/api/auth/refresh` once and retries.
- **Live data** via `src/lib/ws.ts` + `src/hooks/useLiveData` — one WebSocket to
  `/api/ws`; `snapshot` seeds state, `datafeed`/`atis` messages update it. This
  replaces the old app's `setInterval` polling of Next server actions.
- **Auth** via `src/hooks/useAuth` — backed by `GET /api/auth/me`; login is a
  full-page redirect to `/api/auth/vatsim/login`.

The centerpiece is the **dashboard** (`/ids`): a modular react-grid-layout panel
grid. Panels are registered in `src/components/panels/registry.tsx`; each renders
content only, wrapped in shared `Panel` chrome. The serializable `DashboardConfig`
(`src/types/dashboard.type.ts`) is what persists to `dashboard_layouts.config`.

## Database

Small by design — mostly identity + user state; live feed data is not persisted
except last-known ATIS.

| Table | Purpose |
|---|---|
| `users` | VATSIM identity (id = CID, name, email, rating) |
| `accounts` | VATSIM OAuth account/token linkage (parity with the old app) |
| `refresh_tokens` | rotating refresh tokens (hash only); replaces NextAuth DB sessions |
| `dashboard_layouts` | a user's saved dashboard (`config` JSONB) |
| `atis_state` | last-known ATIS per station; seeds change-detection on restart |

## Conventions

- Fetch/poll upstream on the **Go** side; push live data over the WS; use REST for
  everything static. Never call VATSIM/METAR/charts directly from the browser.
- Normalize third-party payloads into typed structs at the boundary (`internal/vatsim`).
- Keep `parser` pure and tested; it is the highest-value correctness surface.
- One vertical concern per PR (see the [skill](../.claude/skills/veids-repo/SKILL.md)).
