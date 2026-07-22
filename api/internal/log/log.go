// Package log configures the application's structured logger (slog): text in
// dev for readability, JSON in prod for ingestion.
package log

import (
	"log/slog"
	"os"
)

// New returns a configured slog.Logger. When dev is true it uses a human-friendly
// text handler; otherwise structured JSON.
func New(dev bool) *slog.Logger {
	var handler slog.Handler
	opts := &slog.HandlerOptions{Level: slog.LevelInfo}
	if dev {
		handler = slog.NewTextHandler(os.Stdout, opts)
	} else {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	}
	return slog.New(handler)
}
