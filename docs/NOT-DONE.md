# Not done yet (deliberate scope boundaries)

The migration now covers: VATSIM OAuth → JWT auth, the datafeed + ATIS WebSocket
pipeline, the DB + migrations, dev/prod Docker, and the full IDS — dashboard shell
with navbar/status/footer/toolbar, the Airports/ATIS panel, the live Map, the
Charts browser, Airport info, and the Timers/Notes panels. Everything below is
intentionally **not** built yet, with enough notes to pick it up.

## Backend

- **Charts/airports cache is in-memory, not in Postgres.** `GET /api/charts` and
  `GET /api/airports/:icao` share a per-process TTL cache (`CHARTS_CACHE_TTL`). The
  `charts_cache` / `airport_cache` tables were intentionally skipped — add them
  (goose migrations + read-through) if a cross-restart / multi-instance cache is
  needed.
- **Charts upstream failures surface as 404.** AviationAPI returns 500 for an
  unknown ICAO (it conflates bad input with server errors), so the handler treats
  any non-200 as "no charts" (404). A genuine AviationAPI outage therefore looks
  like "airport not found" rather than 502. Acceptable for a read-only lookup;
  revisit if you want to distinguish them.
- **Full dashboard CRUD.** Only `GET/PUT /api/dashboards/default` exist. The
  `dashboard_layouts` schema already allows multiple named dashboards; the
  list/create/delete handlers and multi-dashboard support are unbuilt. Config is
  stored as opaque JSONB with **no server-side validation** — validate against the
  `DashboardConfig` schema when CRUD lands.
- **WS client→server messages / per-client subscriptions.** v1 watches every ATIS
  present in the feed and pushes to all clients. There is no `subscribe` message or
  subscription-scoped watched set yet. The `controllers` stream is likewise broadcast
  wholesale (every online position to every client); scope it per-facility if/when
  subscriptions land.
- **Controller feed scope.** The vNAS controller feed
  (`feed/poller.go` → `MsgControllers`) is delivered over the WS only — there is no
  REST controller endpoint and nothing is persisted (the feed is authoritative each
  poll). It reads the **live** environment only; sweatbox/test is a
  `VNAS_CONTROLLER_FEED_URL` change, not wired to a UI. No standalone controllers
  panel yet — only the navbar session indicator + `useControllers()`/`useMyPosition()`.
- **METAR-only airports over the feed.** The WS only carries ATIS for stations with
  an ATIS *online*. A user who adds an ICAO with no online ATIS gets no data (the
  panel shows "No ATIS online"). The old app's METAR-only fallback for arbitrary
  airports needs either a dedicated REST endpoint (`GET /api/airports/:icao/weather`)
  or a subscription mechanism.
- **PKCE** on the OAuth flow (currently `state`-only CSRF, matching the legacy
  provider). Confirm VATSIM Connect S256 support, then add a code verifier/challenge.
- **`Account` token reuse.** VATSIM access/refresh tokens are persisted for parity
  but never used after login; no VATSIM API calls are made on the user's behalf.

## Frontend

- **Controllers overlay on the map.** The map has a stubbed "Controllers" layer. The
  vNAS `controllers` stream now identifies who's online per position, but it carries
  **no lat/lon**, so it can't place markers — the overlay still needs position geometry
  from another source (e.g. boundary/position GeoJSON) before it can render.
- **Dashboard persistence UI** — the config saves via a debounced PUT and loads the
  default, but there's no explicit save/load UI, no multiple named layouts, and no
  breakpoint persistence beyond `lg`.
- **Facility admin** — the initial `/ids/admin` page lists the facilities a user
  administers (VATUSA-synced) but is **read-only**. Still unbuilt: any facility
  CRUD/config editing, a UI to add/remove manual grants (today a `source='manual'`
  row is added by hand — see [permissions.md](permissions.md)), enriching staff
  **CIDs → names** (avoids a per-CID VATSIM call), and surfacing EC/WM (captured
  but not access-granting) if ever wanted.

## General / ops

- **Data import** of existing rows from the old Postgres (users, dashboards). PKs
  were kept as `text` specifically to allow this.
- **Production secrets / VATSIM prod app.** The old repo's dev `VATSIM_CLIENT_SECRET`
  must be rotated and never carried over. Register a prod VATSIM Connect app, set
  `VATSIM_AUTH_URL=https://auth.vatsim.net`, and register the prod callback URL.
  (In dev, register `http://localhost:3000/api/auth/vatsim/callback` — see
  [auth.md](auth.md).)
- **CI, image publishing, deploy manifests.**
- **Tests:** parser golden tests + charts parse test + charts/airports handler tests
  exist. Still missing: auth-flow tests, poller change-detection tests, the
  parser-sync golden-fixture test described in the repo skill, and frontend tests.
