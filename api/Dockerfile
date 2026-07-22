# syntax=docker/dockerfile:1
#
# Production image for vE-IDS: a single self-contained Go binary that serves both
# the REST/WebSocket API (/api) and the embedded static SPA (/*).
# Build context is the REPO ROOT (needs both frontend/ and api/):
#   docker build -f api/Dockerfile -t veids .

# --- Stage 1: build the static SPA ---
FROM node:22-alpine AS frontend
RUN corepack enable
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile || pnpm install
COPY frontend/ ./
RUN pnpm build   # emits /app/frontend/dist

# --- Stage 2: build the Go binary with the SPA embedded ---
FROM golang:1.26 AS backend
WORKDIR /app/api
COPY api/go.mod api/go.sum ./
RUN go mod download
COPY api/ ./
# Replace the committed placeholder dist with the real SPA build so //go:embed
# picks up the actual assets.
RUN rm -rf web/dist
COPY --from=frontend /app/frontend/dist ./web/dist
RUN CGO_ENABLED=0 GOOS=linux go build -o /veids ./cmd/veids

# --- Stage 3: minimal runtime ---
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=backend /veids /veids
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/veids"]
