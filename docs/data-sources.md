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
- **Used by:** `internal/vatsim/charts.go` (client implemented; the REST handler
  and 24h cache are **deferred** — see [NOT-DONE.md](NOT-DONE.md)).
- **v1 → v2 notes:** the query param is `airport` (was `apt`); charts live under a
  top-level `charts` object and metadata under `airport_data`; v2 no longer returns
  ARTCC assignment (which is why ARTCC-based grouping was dropped in favor of
  user-curated airport lists).

## Adding a new data source

1. Add a typed client method + response structs in `internal/vatsim/` (decode only
   the fields you use).
2. If it's **live**, wire it into the poller and push it over the WS
   ([websocket.md](websocket.md)); if it's **static**, add a REST handler in
   `internal/httpx/` with an appropriate cache.
3. Isolate each upstream call so one outage degrades gracefully.
4. Document the endpoint and its quirks here.
