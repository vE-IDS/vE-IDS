# vE-IDS developer tasks. Run `make help` for the list.
.DEFAULT_GOAL := help

.PHONY: help dev down logs build test tidy sqlc openapi migrate migrate-down front-build

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

dev: ## Start the full dev stack (Postgres + API + Vite) via docker-compose
	docker compose up --build

down: ## Stop the dev stack
	docker compose down

logs: ## Tail the API logs
	docker compose logs -f api

build: ## Build the production single-image (API + embedded SPA)
	docker build -f api/Dockerfile -t veids:latest .

test: ## Run the Go test suite
	cd api && go test ./...

tidy: ## Tidy Go modules
	cd api && go mod tidy

sqlc: ## Regenerate the type-safe DB layer from SQL (needs `sqlc` on PATH)
	cd api && sqlc generate

openapi: ## Regenerate the OpenAPI spec + docs from handler annotations (needs `swag` on PATH)
	cd api && swag init -g cmd/veids/main.go -o docs --parseInternal --parseDependency

migrate: ## Apply DB migrations manually (needs $$DATABASE_URL and `goose` on PATH)
	cd api && goose -dir migrations postgres "$$DATABASE_URL" up

migrate-down: ## Roll back the last migration
	cd api && goose -dir migrations postgres "$$DATABASE_URL" down

front-build: ## Build the SPA to frontend/dist
	cd frontend && pnpm build
