package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"veids/api/migrations"
)

// Migrate runs all pending goose migrations against the pool's database. The SQL
// files are embedded (see the migrations package) so the binary is self-contained.
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	goose.SetBaseFS(migrations.FS)
	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("set goose dialect: %w", err)
	}

	// goose needs a *sql.DB; open one backed by the same pgx pool.
	sqlDB := stdlib.OpenDBFromPool(pool)
	defer sqlDB.Close()

	// "." because the embedded FS is rooted at the migrations directory.
	if err := goose.UpContext(ctx, sqlDB, "."); err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}
	return nil
}
