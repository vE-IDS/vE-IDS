# vE-IDS

A virtual-aviation **Integrated Display System** for VATSIM controllers: live ATIS,
weather, traffic, and a customizable dashboard.

This repository is the **decoupled** rewrite of the original Next.js monolith
(`../ve-ids-old`), split into two services:

| Service | Path | Role |
|---|---|---|
| **API** | [`api/`](api/) | Go backend — the **source of truth**. Owns Postgres + migrations, VATSIM OAuth → JWT auth, all REST endpoints, and the datafeed/ATIS WebSocket. In production it also serves the built SPA. |
| **Frontend** | [`frontend/`](frontend/) | React SPA (TanStack Router + Vite). Consumes REST for static data and a WebSocket for live data. Builds to static files. |

**Deployment model:** single origin. The Go binary serves the SPA at `/*` and the
API at `/api/*` (API routes take precedence). Auth is delivered via Secure,
httpOnly cookies so it flows automatically on same-origin REST and the WS upgrade.

```
Browser ──HTTP /* ─────────────▶ Go binary ── serves embedded SPA (prod)
        ──HTTP /api/* ─────────▶            ── chi router: REST + auth
        ──WS   /api/ws ────────▶            ── datafeed + ATIS pushes
                                             └▶ Postgres (users, dashboards, atis_state)
Go poller ──15s──▶ VATSIM datafeed / aviationweather METAR / AviationAPI charts
```

## Quick start (Docker)

```bash
cp .env.example .env          # then fill in VATSIM_CLIENT_ID / _SECRET / JWT_SIGNING_KEY
docker compose up --build
```

- SPA (dev, with HMR): http://localhost:3000
- API: http://localhost:8080/api/health
- Postgres: localhost:5432 (`veids` / `veids`)

Migrations run automatically on API boot. The Vite dev server proxies `/api` and
`/api/ws` to the API container.

## Quick start (local, no Docker)

Prereqs: Go 1.26, Node 22 + pnpm, a local Postgres.

```bash
# API
cd api
cp ../.env.example ../.env     # edit values; DATABASE_URL -> your local Postgres
go run ./cmd/veids             # migrates + listens on :8080

# Frontend (separate terminal)
cd frontend
pnpm install
pnpm dev                       # http://localhost:3000, proxies /api -> :8080
```

## Common tasks

`make help` lists everything. Highlights: `make dev`, `make build` (prod image),
`make test`, `make sqlc`, `make migrate`.

## Documentation

- [docs/architecture.md](docs/architecture.md) — how the two services fit together
- [docs/auth.md](docs/auth.md) — VATSIM OAuth → JWT, cookies, refresh rotation
- [docs/websocket.md](docs/websocket.md) — the live datafeed/ATIS protocol
- [docs/data-sources.md](docs/data-sources.md) — upstream feeds and caching
- [docs/atis-parsing.md](docs/atis-parsing.md) — the ATIS/METAR parser
- [docs/NOT-DONE.md](docs/NOT-DONE.md) — **what this migration deliberately has not built yet**

Agents working in this repo: read [.claude/skills/veids-repo/SKILL.md](.claude/skills/veids-repo/SKILL.md).
