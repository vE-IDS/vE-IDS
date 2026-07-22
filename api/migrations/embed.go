// Package migrations embeds the goose SQL migration files so the compiled binary
// is self-contained and can migrate on boot.
package migrations

import "embed"

// FS holds the embedded *.sql goose migrations, rooted at this directory.
//
//go:embed *.sql
var FS embed.FS
