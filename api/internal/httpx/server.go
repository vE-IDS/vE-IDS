package httpx

import (
	"io/fs"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"veids/api/internal/auth"
	"veids/api/internal/config"
	"veids/api/internal/db/sqlc"
	"veids/api/internal/feed"
)

// Server holds all HTTP dependencies. Handlers are methods on it.
type Server struct {
	cfg     config.Config
	logger  *slog.Logger
	pool    *pgxpool.Pool
	queries *sqlc.Queries
	jwt     *auth.JWTManager
	refresh *auth.RefreshManager
	cookies *auth.CookieManager
	oauth   *auth.OAuthClient
	hub     *feed.Hub
	store   *feed.Store
	static  fs.FS // embedded SPA dist, or nil in dev (Vite serves it)
}

// Deps bundles everything Server needs.
type Deps struct {
	Config  config.Config
	Logger  *slog.Logger
	Pool    *pgxpool.Pool
	Queries *sqlc.Queries
	JWT     *auth.JWTManager
	Refresh *auth.RefreshManager
	Cookies *auth.CookieManager
	OAuth   *auth.OAuthClient
	Hub     *feed.Hub
	Store   *feed.Store
	Static  fs.FS
}

// New constructs a Server.
func New(d Deps) *Server {
	return &Server{
		cfg:     d.Config,
		logger:  d.Logger,
		pool:    d.Pool,
		queries: d.Queries,
		jwt:     d.JWT,
		refresh: d.Refresh,
		cookies: d.Cookies,
		oauth:   d.OAuth,
		hub:     d.Hub,
		store:   d.Store,
		static:  d.Static,
	}
}

// Handler builds the full http.Handler: /api/* first, SPA fallback at /*.
func (s *Server) Handler() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)

	api := chi.NewRouter()
	api.Get("/health", s.handleHealth)

	api.Route("/auth", func(r chi.Router) {
		r.Get("/vatsim/login", s.handleLogin)
		r.Get("/vatsim/callback", s.handleCallback)
		r.Post("/refresh", s.handleRefresh)

		r.Group(func(r chi.Router) {
			r.Use(s.requireAuth)
			r.Get("/me", s.handleMe)
			r.Post("/logout", s.handleLogout)
		})
	})

	// Authenticated application routes.
	api.Group(func(r chi.Router) {
		r.Use(s.requireAuth)
		r.Get("/ws", s.handleWS)
		r.Get("/dashboards/default", s.handleGetDefaultDashboard)
		r.Put("/dashboards/default", s.handlePutDefaultDashboard)
	})

	r.Mount("/api", api)
	r.Handle("/*", s.spaHandler())
	return r
}
