// Package seed applies idempotent reference data to the database on every boot.
//
// Unlike goose migrations (which run once), seeds run every time the server
// starts, so the baseline permission/role model is self-healing: adding a
// permission, role, or mapping to the data in this package makes it appear after
// the next restart without a new migration. Every seed is an upsert, so running
// them repeatedly is safe.
package seed

import (
	"context"
	"fmt"
	"log/slog"

	"veids/api/internal/db/sqlc"
)

// Seed is one idempotent seeding step.
type Seed struct {
	Name string
	Run  func(ctx context.Context, q *sqlc.Queries) error
}

// RunAll runs the built-in seeds, then any extra seeds, in order. The first
// failure aborts and is returned (a missing baseline permission set is fatal;
// the caller decides how to treat dynamic seeds passed via extra).
func RunAll(ctx context.Context, q *sqlc.Queries, logger *slog.Logger, extra ...Seed) error {
	seeds := append(builtinSeeds(), extra...)
	for _, s := range seeds {
		if err := s.Run(ctx, q); err != nil {
			return fmt.Errorf("seed %q: %w", s.Name, err)
		}
		logger.Info("seed applied", "seed", s.Name)
	}
	return nil
}

func builtinSeeds() []Seed {
	return []Seed{
		{Name: "permissions", Run: seedPermissions},
	}
}
