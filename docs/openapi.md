# OpenAPI / API docs

The API describes itself with an OpenAPI spec generated from handler annotations
using [swaggo/swag](https://github.com/swaggo/swag), so the current surface is
always visible and browsable.

## Generating

```
make openapi   # cd api && swag init -g cmd/veids/main.go -o docs --parseInternal --parseDependency
```

This scans the general API info on `main()` and the `// @Summary / @Tags /
@Param / @Success / @Router / @Security` annotations on the `httpx` handlers, and
writes **generated** files to `api/docs/` (`docs.go`, `swagger.json`,
`swagger.yaml`). Treat these like the sqlc output — **never edit them by hand**;
change the annotations and re-run `make openapi`. Requires `swag` on PATH
(`go install github.com/swaggo/swag/cmd/swag@latest`).

## Viewing

In **dev**, the interactive Swagger UI is served by the API at:

```
http://localhost:8080/api/docs/index.html      (or via the Vite proxy on :3000)
```

The raw spec is at `/api/docs/doc.json`. The UI route is registered only when
`ENV=dev` (`internal/httpx/server.go`), so it is not exposed in production.

## Auth in the spec

Authenticated endpoints declare `@Security CookieAuth`, matching the httpOnly
`veids_at` access-JWT cookie (see [auth.md](auth.md)). The Swagger "Try it out"
button works in the browser because the cookie rides along automatically once
you've logged in.

## When you change the API

Add/adjust the annotations on the handler in the same change, run `make openapi`,
and commit the regenerated `api/docs/`. New handlers without annotations simply
won't appear in the spec.
