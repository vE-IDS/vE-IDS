# WebSocket protocol

A single WebSocket at `GET /api/ws` carries **only** live data. Everything else
is REST. Only two kinds of updates flow over it:

1. **datafeed** — a slim projection of the VATSIM datafeed, on every changed poll.
2. **atis** — per-airport ATIS reports, pushed **only when an ATIS changes**.

Implemented in `api/internal/feed/` (poller, store, hub, client, protocol) and the
handler `api/internal/httpx/ws.go`. Client side: `frontend/src/lib/ws.ts` +
`src/hooks/useLiveData`.

## Connecting & auth

Connect to `` `${wsProto}://${location.host}/api/ws` `` (same origin). The
`veids_at` cookie is sent automatically on the upgrade and verified **before** the
socket is accepted — an unauthenticated upgrade gets 401. The server locks the
allowed `Origin` to the app origin in production (any origin in dev, for the Vite
proxy).

## Message envelope

Every server→client frame is JSON:

```jsonc
{ "type": "snapshot" | "datafeed" | "atis", "ts": 1721600000000, "data": ... }
```

`ts` is Unix milliseconds. There are three message types:

### `snapshot` — once, immediately on connect

Seeds a fresh client so it renders without waiting for the next poll tick.

```jsonc
{
  "type": "snapshot",
  "ts": 1721600000000,
  "data": {
    "datafeed": { "updateTimestamp": "...", "connectedClients": 1234, "pilots": [ /* PilotMarker[] */ ] },
    "atis": [ /* Report[] — all currently-online ATIS stations */ ]
  }
}
```

### `datafeed` — on each changed poll (~15s)

```jsonc
{ "type": "datafeed", "ts": 0, "data": { "updateTimestamp": "...", "connectedClients": 1234, "pilots": [ /* PilotMarker[] */ ] } }
```

`PilotMarker`: `{ callsign, lat, lon, heading, altitude, groundspeed, departure?, arrival?, aircraft? }`.

### `atis` — only when a station's ATIS changes

Carries **only** the stations whose ATIS code letter changed this tick (not the
full set):

```jsonc
{ "type": "atis", "ts": 0, "data": [ /* Report[] — changed stations only */ ] }
```

A `Report` is wire-compatible with the frontend `AirportWeather` type:

```ts
{
  icao: string
  airportName?: string
  atisAvailable: boolean
  atisLetter?: string
  atisText?: string
  metar: string
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR'
  wind?: { direction: string; speed: number; gust?: number }
  altimeter?: number
}
```

## Change detection

The poller keeps the last-seen ATIS code letter per station in memory
(`feed/store.go`) and only emits an `atis` message for stations whose letter
changed. The state is persisted to the `atis_state` table and re-seeded on boot,
so a restart does not spuriously re-broadcast every station.

## Client merge rules

`useLiveData` maintains `atisByIcao: Map<icao, AirportWeather>` and the latest
datafeed projection:

- `snapshot` → replace both.
- `datafeed` → replace the projection.
- `atis` → merge each report into the map by `icao`.

The Airports panel reads a single airport via `useAtis(icao)`.

## Slow clients & reconnect

The hub gives each client a bounded send buffer; a client that can't keep up is
dropped (close 1011) rather than blocking the hub. The client reconnects with
backoff and re-receives a fresh `snapshot`.
