# Permissions & facility access

vE-IDS gates the **admin area** on a fine-grained permission model, seeded from
VATUSA facility staff and extendable for future manual grants. The rest of the
IDS (dashboard, map, charts, airport info) remains open to any VATSIM login —
only `/ids/admin` and the `/api/admin/*` endpoints require access.

## The model

Four tables (migration `00006_facilities_permissions.sql`), keyed by stable
`text` ids like the rest of the schema:

| Table | Purpose |
|---|---|
| `permissions` | fine-grained capability definitions (`system.access`, `facility.view`, …) |
| `roles` | named bundles of permissions (`facility.atm`, `facility.faccbt`, `system.admin`, …) |
| `role_permissions` | which permissions each role grants (many-to-many) |
| `user_facility_roles` | a **grant**: a CID holds a role at a facility (or system-wide) |

`facilities` (same migration) is the extensible per-ARTCC record — see
[vatusa.md](vatusa.md).

### Grants are keyed on CID, not a user FK

`user_facility_roles.cid` is a bare CID, **not** a foreign key to `users(id)`.
This lets staff be granted access *before* they have ever logged into vE-IDS;
the grant activates automatically on their first login (their VATSIM CID becomes
`users.id`). `facility_id` is nullable — `NULL` means a system-wide grant.

### Effective permissions

A controller's effective permissions are the union of the permissions of every
role granted to their CID, across all facilities:

```
user_facility_roles (by cid) → role_permissions → distinct permission_keys
```

This is `GetUserPermissions` (`internal/db/queries/facilities.sql`). The admin
routes check it via the `requirePermission("system.access")` middleware
(`internal/httpx/middleware.go`); permissions are read from the DB per request,
so the access JWT stays identity-only.

## Baseline permission/role matrix

Seeded on **every boot** (see below). Access roles all include `system.access`
+ `facility.view`; ATM/DATM/TA additionally get management permissions reserved
for future features.

| Permission | Meaning |
|---|---|
| `system.access` | may access the vE-IDS admin system at all |
| `facility.view` | view facility administration info |
| `facility.manage_roster` | (future) manage a facility roster |
| `facility.manage_config` | (future) edit facility configuration |

| Role | Source | Permissions |
|---|---|---|
| `facility.atm` | VATUSA | access, view, manage_roster, manage_config |
| `facility.datm` | VATUSA | access, view, manage_roster, manage_config |
| `facility.ta` | VATUSA | access, view, manage_config |
| `facility.fe` | VATUSA | access, view |
| `facility.faccbt` | VATUSA | access, view |
| `system.admin` | manual | access, view, manage_roster, manage_config |

EC and WM are captured on the facility for display but **do not** grant access.

## Modular seeding (`internal/db/seed`)

Reference data is applied by a small seeder run on **every** boot, right after
migrations (`main.go`). Unlike goose migrations (which run once), the seeder is
idempotent (upserts) and runs every time, so the baseline is self-healing:
adding a permission, role, or mapping to the Go data in
`internal/db/seed/permissions.go` makes it appear after the next restart — no new
migration required.

```go
seed.RunAll(ctx, queries, logger)   // runs builtinSeeds(), then any extra seeds
```

To add a new capability: add it to `permissions`, wire it into a role in
`rolePermissions`, restart. To add a whole new seed step: append a `Seed` to
`builtinSeeds()`.

## Adding a user manually

Insert a grant with `source='manual'` — the VATUSA syncer only reconciles
`source='vatusa'` rows, so manual grants survive every sync:

```sql
-- Give CID 1400000 system-wide admin:
INSERT INTO user_facility_roles (cid, facility_id, role_key, source, granted_by)
VALUES ('1400000', NULL, 'system.admin', 'manual', '<your-cid>');

-- Or a facility-scoped role:
INSERT INTO user_facility_roles (cid, facility_id, role_key, source, granted_by)
VALUES ('1400000', 'ZJX', 'facility.ta', 'manual', '<your-cid>');
```

(A UI for manual grants is intentionally not built yet — see
[NOT-DONE.md](NOT-DONE.md).)
