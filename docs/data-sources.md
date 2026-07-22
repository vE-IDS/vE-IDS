# Data sources

vE-IDS aggregates several public aviation feeds. None require an API key. Unlike
the old app (which fetched these from Next server actions and cached them in the
Next data cache), the **Go API** now owns all upstream fetching — the datafeed via
the background poller, the rest on demand. Clients never call these directly.

Typed clients live in `api/internal/vatsim/`.

## VATSIM datafeed

- **Endpoint:** `https://data.vatsim.net/v3/vatsim-data.json` (`DATAFEED_URL`)
- **Used by:** `internal/vatsim/datafeed.go`, driven by `internal/feed/poller.go`
- **Cadence:** polled once every `DATAFEED_POLL_INTERVAL` (15s) by a single
  goroutine, regardless of how many clients are connected. Ticks where the feed's
  `update_timestamp` is unchanged are skipped.
- **Use:** the `atis[]` array (per-airport ATIS) and `pilots[]` (map traffic). The
  full feed is multiple MB, so only a slim projection is pushed to clients.
- **Persistence:** not persisted, except last-known ATIS per station (`atis_state`).

## aviationweather.gov (METAR)

- **Endpoint:** `https://aviationweather.gov/api/data/metar?ids=<ICAO>` (`METAR_URL`)
- **Used by:** `internal/vatsim/metar.go`, called from the poller for stations with
  an online ATIS.
- **Cadence:** at most once per airport per `metarTTL` (60s), cached in the poller.
- **Use:** the real-world METAR, and the preferred source for wind/altimeter/flight
  category (the coded METAR parses more reliably than free-text ATIS). Failures
  degrade gracefully to an empty string.

## AviationAPI v2 (charts + airport metadata)

- **Base:** `https://api-v2.aviationapi.com/v2` (`CHARTS_API_URL`)
- **Endpoint:** `GET /charts?airport=<ICAO>` — airport metadata + charts grouped by
  category.
- **Used by:** `internal/vatsim/charts.go` (`FetchAirportCharts` parses the v2
  payload into a typed `ChartSet`), served by two REST endpoints in
  `internal/httpx/charts.go`: `GET /api/charts?airport=ICAO` (full `ChartSet`) and
  `GET /api/airports/:icao` (the `AirportData` subset). Both require auth and share
  an in-memory TTL cache (`CHARTS_CACHE_TTL`, default 24h) keyed by ICAO. PDFs are
  loaded by the browser directly from each chart's `pdfPath` (not proxied).
- **v1 → v2 notes:** the query param is `airport` (was `apt`); charts live under a
  top-level `charts` object and metadata under `airport_data`; v2 no longer returns
  ARTCC assignment (which is why ARTCC-based grouping was dropped in favor of
  user-curated airport lists).

## VATUSA (facility roster / staff)

- **Base:** `https://api.vatusa.net/v2` (`VATUSA_API_URL`)
- **Endpoints:** `GET /facility` (list + staff CIDs) and `GET /facility/{id}`
  (roster roles — the only source of `FACCBT`). Both are public; no key needed
  for the fields used.
- **Used by:** `internal/vatusa` (hand-written typed client) via the
  `internal/facility` syncer.
- **Cadence:** synced on boot, then every `VATUSA_SYNC_INTERVAL` (default 2h).
  Results are **persisted** to `facilities` + `user_facility_roles`, so access
  checks and the admin page read the DB — the DB is the cache.
- **Why hand-written, not generated:** the published VATUSA OpenAPI spec is too
  low-fidelity to codegen a usable client from (empty schema properties,
  unlinked response bodies, mislabeled params, missing `/v2` base).
- Full detail: [vatusa.md](vatusa.md) · access model: [permissions.md](permissions.md).

## Adding a new data source

1. Add a typed client method + response structs in `internal/vatsim/` (decode only
   the fields you use).
2. If it's **live**, wire it into the poller and push it over the WS
   ([websocket.md](websocket.md)); if it's **static**, add a REST handler in
   `internal/httpx/` with an appropriate cache.
3. Isolate each upstream call so one outage degrades gracefully.
4. Document the endpoint and its quirks here.
