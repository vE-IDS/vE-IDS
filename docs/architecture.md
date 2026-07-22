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
cmd/veids/main.go          composition root: config → pool → migrate → seed → poller+hub → vatusa syncer → http server → graceful shutdown
internal/config            env → Config (12-factor)
internal/db                pgxpool, embedded goose migrations, sqlc-generated queries, modular boot seeder (db/seed)
internal/auth              VATSIM OAuth client, JWT, rotating refresh tokens, cookies, request-context user
internal/vatsim            typed clients for the datafeed, METARs, AviationAPI charts
internal/vatusa            typed client for the VATUSA API (facilities + rosters)
internal/facility          VATUSA syncer: facilities + access grants (boot + every 2h)
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
  `/api/auth/refresh` once and retries. Fetches: `GET /api/auth/me`,
  `GET/PUT /api/dashboards/default`, `GET /api/charts?airport=ICAO`,
  `GET /api/airports/:icao`. Server responses are cached with TanStack Query.
- **Live data** via `src/lib/ws.ts` + the `liveData` **Zustand store** — one
  WebSocket to `/api/ws`; `snapshot` seeds state, `datafeed`/`atis` messages update
  it. Selector hooks: `useAtis`, `useDatafeed`, `useLiveStatus`, `useLiveFreshness`.
  This replaces the old app's `setInterval` polling of Next server actions.
- **Auth** via `src/hooks/useAuth` — backed by `GET /api/auth/me`; login is a
  full-page redirect to `/api/auth/vatsim/login`.

**State split:** long-lived client state lives in **Zustand** (`src/stores/`) — the
`liveData` store (datafeed/ATIS/status) and the `dashboard` store (config +
debounced-save status). TanStack Query is used only for server fetches. Auth is
server state, so it stays in Query.

The centerpiece is the **`/ids`** area, a layout route wrapping child routes:
`ids.index` (the dashboard), `ids.map` (live Leaflet map), `ids.charts` (chart
browser + PDF), `ids.info.$icao` (airport info); plus a shared dark **Navbar**
(status dropdown, clock, nav icons, user), a bottom **Footer** nav, and a
**PanelToolbar** (add/reset/save). The **dashboard** is a modular react-grid-layout
grid; panels are registered in `src/components/panels/registry.tsx` (`airport`,
`timer`, `notes`), each rendering content only inside shared `Panel` chrome. The
serializable `DashboardConfig` (`src/types/dashboard.type.ts`) persists to
`dashboard_layouts.config`.

The **map** rides the existing WebSocket — it renders `useDatafeed().pilots`
directly, with no extra fetch or endpoint. The **charts** and **airport-info** pages
call the two AviationAPI-backed REST endpoints (server-cached; see
[data-sources.md](data-sources.md)).

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
| `facilities` | VATUSA ARTCCs (name/region/url/active + extensible `metadata` JSONB) |
| `permissions` | fine-grained capability definitions (seeded on boot) |
| `roles` | named bundles of permissions (seeded on boot) |
| `role_permissions` | role → permission mapping |
| `user_facility_roles` | grants: a CID holds a role at a facility (VATUSA-synced or manual) |

The last five back facility administration — see [permissions.md](permissions.md)
and [vatusa.md](vatusa.md). Permission/role reference data is applied by an
idempotent **seeder** (`internal/db/seed`) run on every boot after migrations,
and facility/staff data by the VATUSA **syncer** (`internal/facility`) on boot +
every 2h.

## Conventions

- Fetch/poll upstream on the **Go** side; push live data over the WS; use REST for
  everything static. Never call VATSIM/METAR/charts directly from the browser.
- Normalize third-party payloads into typed structs at the boundary (`internal/vatsim`).
- Keep `parser` pure and tested; it is the highest-value correctness surface.
- One vertical concern per PR (see the [skill](../.claude/skills/veids-repo/SKILL.md)).
