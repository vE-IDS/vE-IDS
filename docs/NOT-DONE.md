# Not done yet (deliberate scope boundaries)

This migration delivered the **foundation + one complete vertical slice**: VATSIM
OAuth → JWT auth, the datafeed + ATIS WebSocket pipeline, the DB + migrations, the
dev/prod Docker setup, docs, and the IDS dashboard shell with a live **Airports /
ATIS** panel end-to-end. Everything below is intentionally **not** built yet, with
enough notes to pick it up.

## Backend

- **Charts REST endpoint** (`GET /api/charts?airport=`) and **airport-info**
  (`GET /api/airports/:icao`), plus their 24h `charts_cache` / `airport_cache`
  tables. The AviationAPI client exists (`internal/vatsim/charts.go`) but no
  handler consumes it. Add the tables as new goose migrations + read-through cache.
- **Full dashboard CRUD.** Only `GET/PUT /api/dashboards/default` exist. The
  `dashboard_layouts` schema already allows multiple named dashboards; the
  list/create/delete handlers and multi-dashboard support are unbuilt. Config is
  currently stored as opaque JSONB with **no server-side validation** — validate
  against the `DashboardConfig` schema when CRUD lands.
- **WS client→server messages / per-client subscriptions.** v1 watches every ATIS
  present in the feed and pushes to all clients. There is no `subscribe` message or
  subscription-scoped watched set yet.
- **METAR-only airports over the feed.** The WS only carries ATIS for stations with
  an ATIS *online*. A user who adds an ICAO with no online ATIS gets no data (the
  panel shows "No ATIS online"). The old app's METAR-only fallback for arbitrary
  airports needs either a REST endpoint (`GET /api/airports/:icao/weather`) or a
  subscription mechanism.
- **PKCE** on the OAuth flow (currently `state`-only CSRF, matching the legacy
  provider). Confirm VATSIM Connect S256 support, then add a code verifier/challenge.
- **`Account` token reuse.** VATSIM access/refresh tokens are persisted for parity
  but never used after login; no VATSIM API calls are made on the user's behalf.
- **Charts/airports cache eviction, metrics, rate-limit handling** for upstreams.

## Frontend

Only the **Airports / ATIS** panel is ported. Not yet migrated from the old app:

- **Live map** (`/ids/map`) — Leaflet + the pilots overlay. The datafeed projection
  (with `pilots[]`) already flows over the WS, so the data is available.
- **Charts browser** (`/ids/charts`) — depends on the charts REST endpoint.
- **Airport info page** (`/ids/info/:icao`) — depends on the airport-info endpoint.
- **Admin** (`/admin`) — was a stub in the old app too.
- **Timers** and **Notes** panels — only `airport` is registered/ported.
- **Dashboard persistence UI** — save/load, multiple named layouts, reset. The shell
  currently renders a bundled default (and can read a saved default via
  `GET /api/dashboards/default`), but there is no save UI wired.

## General / ops

- **Data import** of existing rows from the old Postgres (users, dashboards). PKs
  were kept as `text` specifically to allow this.
- **Production secrets / VATSIM prod app.** The old repo's dev `VATSIM_CLIENT_SECRET`
  must be rotated and never carried over. Register a prod VATSIM Connect app and set
  `VATSIM_AUTH_URL=https://auth.vatsim.net`.
- **CI, image publishing, deploy manifests.**
- **Tests** beyond the parser golden tests (auth flow, poller change-detection,
  handler-level tests) and any frontend tests.
