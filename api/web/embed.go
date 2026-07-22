// Package web embeds the built SPA (frontend/dist, copied to ./dist at image
// build time) so the production binary serves the static site itself. In dev the
// SPA is served by Vite and this embed holds only a placeholder index.html.
package web

import (
	"embed"
	"io/fs"
)

//go:embed all:dist
var distFS embed.FS

// DistFS returns the SPA file system rooted at the dist directory.
func DistFS() (fs.FS, error) {
	return fs.Sub(distFS, "dist")
}
