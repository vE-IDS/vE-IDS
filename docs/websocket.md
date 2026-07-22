# WebSocket protocol

A single WebSocket at `GET /api/ws` carries **only** live data. Everything else
is REST. Three kinds of updates flow over it:

1. **datafeed** — a slim projection of the VATSIM datafeed, on every changed poll.
2. **atis** — per-airport ATIS reports, pushed **only when an ATIS changes**.
3. **controllers** — vNAS controller connections, pushed as a **delta** (only
   connections that logged on/off/changed).

Implemented in `api/internal/feed/` (poller, store, hub, client, protocol) and the
handler `api/internal/httpx/ws.go`. Client side: `frontend/src/lib/ws.ts` +
`src/hooks/useLiveData`.

The socket negotiates **permessage-deflate** compression
(`CompressionNoContextTakeover`); browsers enable it automatically, so JSON frames
(the datafeed especially) go over the wire compressed with no client change.

## Connecting & auth

Connect to `` `${wsProto}://${location.host}/api/ws` `` (same origin). The
`veids_at` cookie is sent automatically on the upgrade and verified **before** the
socket is accepted — an unauthenticated upgrade gets 401. The server locks the
allowed `Origin` to the app origin in production (any origin in dev, for the Vite
proxy).

## Message envelope

Every server→client frame is JSON:

```jsonc
{ "type": "snapshot" | "datafeed" | "atis" | "controllers", "ts": 1721600000000, "data": ... }
```

`ts` is Unix milliseconds. There are four message types:

### `snapshot` — once, immediately on connect

Seeds a fresh client so it renders without waiting for the next poll tick.

```jsonc
{
  "type": "snapshot",
  "ts": 1721600000000,
  "data": {
    "datafeed": { "updateTimestamp": "...", "connectedClients": 1234, "pilots": [ /* PilotMarker[] */ ] },
    "atis": [ /* Report[] — all currently-online ATIS stations */ ],
    "controllers": [ /* ControllerConnection[] — all currently-online positions */ ]
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

### `controllers` — only when a controller connection changes

A **delta**: `upserted` carries connections that logged on or changed;
`removed` carries the `positionId`s that logged off. One entry per staffed
position (a controller on combined positions yields several).

```jsonc
{
  "type": "controllers",
  "ts": 0,
  "data": {
    "upserted": [ /* ControllerConnection[] — new or changed */ ],
    "removed": [ "positionId", /* ... logged-off position ids */ ]
  }
}
```

`ControllerConnection` (sourced from the vNAS controller feed; real names are not
carried):

```ts
{
  cid: string
  callsign: string
  artccId: string
  facilityId: string
  facilityName: string
  positionId: string      // delta key
  positionName: string
  radioName: string       // readable label, e.g. "O'Hare Tower" (navbar uses this)
  positionType: string    // Artcc | Tracon | Atct
  frequency: string       // MHz, e.g. "120.900" ("" when inactive)
  isPrimary: boolean
  isActive: boolean
  isObserver: boolean
  loginTime: string
}
```

## Change detection

The poller keeps the last-seen ATIS code letter per station in memory
(`feed/store.go`) and only emits an `atis` message for stations whose letter
changed. The state is persisted to the `atis_state` table and re-seeded on boot,
so a restart does not spuriously re-broadcast every station.

Controllers work the same way but in-memory only (not persisted — the feed is
authoritative on every poll): the poller diffs the current controller set against
the previous tick, keyed by `positionId`, and emits a `controllers` delta of the
`upserted`/`removed` entries. The vNAS feed is fetched on its own change gate
(`updatedAt`), independent of the VATSIM datafeed, so a controller change is
pushed even on a tick where the pilots datafeed didn't change.

## Client merge rules

`useLiveData` maintains `atisByIcao: Map<icao, AirportWeather>`,
`controllersByPositionId: Map<positionId, ControllerConnection>`, and the latest
datafeed projection:

- `snapshot` → replace all.
- `datafeed` → replace the projection.
- `atis` → merge each report into the map by `icao`.
- `controllers` → apply the delta: upsert each entry by `positionId`, delete each
  `removed` id.

The Airports panel reads a single airport via `useAtis(icao)`. The navbar reads
the signed-in user's active position via `useMyPosition()` (matched by CID);
`useControllers()` exposes the full set.

## Slow clients & reconnect

The hub gives each client a bounded send buffer; a client that can't keep up is
dropped (close 1011) rather than blocking the hub. The client reconnects with
backoff and re-receives a fresh `snapshot`.
