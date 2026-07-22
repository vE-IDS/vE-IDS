# VATUSA integration

vE-IDS syncs VATUSA facilities and staff to decide who may access the admin
area, and to display basic facility information. The Go API owns all VATUSA
fetching (the browser never calls VATUSA); the results are persisted, so access
checks and the admin page read the database, not the upstream.

## Upstream (`internal/vatusa`)

A hand-written typed client (`api.vatusa.net/v2`). The published OpenAPI spec is
too low-fidelity to generate from (empty schema properties, response bodies not
linked to endpoints, path params mislabeled as query params, missing `/v2`
base), so the client follows the same decode-only-what-you-use convention as
`internal/vatsim`.

| Endpoint | Auth | Use |
|---|---|---|
| `GET /facility` | public | facility list; embeds each ARTCC's `atm/datm/ta/fe/ec/wm` staff CIDs + `active`/`region` |
| `GET /facility/{id}` | public | `data.facility.roles[]` — the only source of the **`FACCBT`** role |

Roles seen on rosters: `ATM, DATM, TA, FE, EC, WM, FACCBT, INS, MTR`. Only
`ATM, DATM, TA, FE, FACCBT` grant access (see [permissions.md](permissions.md)).
`VATUSA_API_KEY` is optional and unused by these public endpoints.

## The syncer (`internal/facility`)

A background job modeled on the feed poller: it syncs once on boot, then every
`VATUSA_SYNC_INTERVAL` (default `2h`). Each sync:

1. `FetchFacilities` → **upsert** each into `facilities`. Core fields become
   columns; the staff CIDs go into the extensible `metadata` JSONB bag
   (`{"staff":{"atm":…,"datm":…,…}}`).
2. For each facility, `FetchFacilityRoles` (bounded concurrency) → collect the
   `FACCBT`/`ATM`/`DATM`/`TA`/`FE` CIDs. This is where FACCBT comes from.
3. In **one transaction**: `DeleteGrantsBySource('vatusa')` then reinsert the
   fresh, de-duplicated grant set. `source='manual'` grants are never touched.

The persisted grants **are** the 2-hour cache: the `2h` interval governs how
often the DB is reconciled with VATUSA. Sync failures are logged and non-fatal —
stale grants keep serving until the next successful sync.

## Extending the facilities table

`facilities.metadata` (JSONB) is the seam for attaching new per-facility values
later (e.g. positions, config, feature flags) without a migration. Add columns
only for values you need to query/join on; everything else can live in
`metadata`.

## Config

| Var | Default | Meaning |
|---|---|---|
| `VATUSA_API_URL` | `https://api.vatusa.net/v2` | client base URL |
| `VATUSA_API_KEY` | *(empty)* | optional; reserved for authenticated fields |
| `VATUSA_SYNC_INTERVAL` | `2h` | sync cadence |
