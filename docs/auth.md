# Authentication

The Go API owns VATSIM Connect OAuth end-to-end and issues its **own** JSON Web
Tokens. The browser never sees a VATSIM token, and there are no server-side
"session" rows for access — the access token is a stateless JWT; only refresh
tokens are stored (by hash) for rotation. This replaces the old app's NextAuth
database-session model.

Code lives in `api/internal/auth/` and the handlers in `api/internal/httpx/auth.go`.

## Cookies

Two auth cookies, both `HttpOnly`, `SameSite=Lax`, and `Secure` (except when
`ENV=dev`, so they work over `http://localhost`):

| Cookie | Contents | Path | Lifetime |
|---|---|---|---|
| `veids_at` | access JWT (HS256) | `/` | `ACCESS_TOKEN_TTL` (default 15m) |
| `veids_rt` | opaque refresh token | `/api/auth` | `REFRESH_TOKEN_TTL` (default 30d) |

The refresh cookie is path-scoped to `/api/auth` so it is only sent to the auth
endpoints. Because both are same-origin, they ride along automatically on REST
calls **and** the WebSocket upgrade — which is why WS auth uses the cookie
(browsers cannot set custom headers on a WS handshake).

## Endpoints

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/vatsim/login` | GET | — | set a CSRF `state` cookie, 302 to VATSIM authorize |
| `/api/auth/vatsim/callback` | GET | — | validate state → exchange code → fetch profile → upsert user → set cookies → 302 to `/` |
| `/api/auth/refresh` | POST | refresh cookie | rotate refresh token, mint a new access JWT |
| `/api/auth/me` | GET | access JWT | current user profile |
| `/api/auth/logout` | POST | access JWT | revoke refresh token, clear cookies |

## Login flow

```
Browser              Go API                         VATSIM Connect
  │ GET /login ───────▶ set veids_oauth_state         │
  │ ◀── 302 ───────────  redirect to authorize ──────▶│  (consent)
  │ ◀───────────────────────────── 302 /callback?code&state ──┘
  │ GET /callback ────▶ verify state cookie
  │                     POST /oauth/token (code + client secret)
  │                     GET  /api/user (Bearer)
  │                     upsert users + accounts
  │                     issue JWT + refresh, set veids_at / veids_rt
  │ ◀── 302 /ids ──────
```

`state` is a 32-byte random value stored in a short-lived cookie and compared on
callback (CSRF protection). PKCE is not used yet (the legacy provider didn't
either); see [NOT-DONE.md](NOT-DONE.md). The callback ends with a **relative**
`302 /ids`, so the browser lands on whatever origin it was using (the SPA).

### Dev origin (must run same-origin with the SPA)

Cookies are httpOnly and host-only, so the OAuth handshake must happen on the
**same origin as the SPA** or the cookies won't be sent to it. In dev the SPA is
the Vite server on `:3000`, which proxies `/api` (including `/api/auth/*`) to the
Go server on `:8080`. Therefore in dev:

- `APP_BASE_URL=http://localhost:3000` (not `:8080`) — this makes the OAuth
  `redirect_uri` default to `http://localhost:3000/api/auth/vatsim/callback`, so
  the callback comes back through the Vite proxy and `Set-Cookie` binds to `:3000`.
- **Register `http://localhost:3000/api/auth/vatsim/callback`** as a callback URL in
  the VATSIM Connect dev app.

If `APP_BASE_URL` points at `:8080` in dev, login "works" but strands the browser on
the API origin with cookies the SPA can't see. In prod there is a single origin, so
`APP_BASE_URL` is just the public domain and none of this applies.

The VATSIM CID is used as the `users.id` (a stable text PK). Claims on the access
JWT: `sub` = user id, `cid`, `rat` = rating, plus `iss=veids` / `aud=veids-spa`.

## Refresh rotation & reuse detection

Refresh tokens are opaque random strings; only their SHA-256 hash is stored in
`refresh_tokens`. On `POST /api/auth/refresh` (`auth/refresh.go`):

1. Look up the presented token by hash.
2. If it is already **revoked**, treat it as theft → revoke the user's entire
   token set and return 401.
3. If expired → 401.
4. Otherwise issue a new refresh token, mark the old one revoked with
   `replaced_by` pointing at the new id, and mint a fresh access JWT.

## Authorization (admin access)

Authentication (a valid VATSIM login) is separate from **authorization**. Any
authenticated controller can use the IDS; only the admin area requires a
permission. The `requirePermission("system.access")` middleware
(`httpx/middleware.go`) runs after `requireAuth` on the `/api/admin/*` group,
loads the user's effective permissions from the database by CID, and returns
**403** if the permission is absent. Permissions are read per request, so the
access JWT stays identity-only (no role claims). `GET /api/auth/me` also returns
the user's `permissions` + `facilities` so the SPA can conditionally render the
Admin nav. See [permissions.md](permissions.md) for the model and
[vatusa.md](vatusa.md) for how grants are seeded.

## Client behavior

The SPA never reads the cookies. `src/lib/api.ts` sends `credentials: 'include'`;
on a 401 it calls `/api/auth/refresh` once and retries the original request. If
the refresh also fails, the user is treated as logged out. Middleware
(`httpx/middleware.go` `requireAuth`) protects all authenticated REST routes and
the WebSocket.
