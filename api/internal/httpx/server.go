package httpx

import (
	"context"
	"io/fs"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	httpSwagger "github.com/swaggo/http-swagger/v2"

	_ "veids/api/docs" // generated OpenAPI spec (registers itself for the Swagger UI)
	"veids/api/internal/auth"
	"veids/api/internal/config"
	"veids/api/internal/db/seed"
	"veids/api/internal/db/sqlc"
	"veids/api/internal/feed"
	"veids/api/internal/vatsim"
)

// chartsFetcher fetches parsed charts for an ICAO; abstracted so handler tests
// can stub it without hitting AviationAPI.
type chartsFetcher func(ctx context.Context, icao string) (*vatsim.ChartSet, error)

// metarFetcher fetches raw METAR text for an ICAO ("" on failure). Abstracted so
// handler tests can stub it without hitting aviationweather.gov.
type metarFetcher func(ctx context.Context, icao string) string

// permsFetcher returns the distinct permission keys a CID holds. Abstracted so
// authz middleware + admin handler tests can stub it without a database.
type permsFetcher func(ctx context.Context, cid string) ([]string, error)

// facilityRolesFetcher returns a CID's facility/role grants (with facility
// display fields). Same test-seam rationale as permsFetcher.
type facilityRolesFetcher func(ctx context.Context, cid string) ([]sqlc.GetUserFacilityRolesRow, error)

type cachedCharts struct {
	data *vatsim.ChartSet
	at   time.Time
}

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

	fetchCharts        chartsFetcher
	fetchMetar         metarFetcher
	fetchPerms         permsFetcher
	fetchFacilityRoles facilityRolesFetcher
	chartsTTL          time.Duration
	chartsMu           sync.Mutex
	chartsCache        map[string]cachedCharts
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
	Vatsim  *vatsim.Client
	Static  fs.FS
}

// New constructs a Server.
func New(d Deps) *Server {
	s := &Server{
		cfg:         d.Config,
		logger:      d.Logger,
		pool:        d.Pool,
		queries:     d.Queries,
		jwt:         d.JWT,
		refresh:     d.Refresh,
		cookies:     d.Cookies,
		oauth:       d.OAuth,
		hub:         d.Hub,
		store:       d.Store,
		static:      d.Static,
		chartsTTL:   d.Config.ChartsCacheTTL,
		chartsCache: map[string]cachedCharts{},
	}
	if d.Vatsim != nil {
		s.fetchCharts = d.Vatsim.FetchAirportCharts
		s.fetchMetar = d.Vatsim.FetchMetar
	}
	if d.Queries != nil {
		s.fetchPerms = d.Queries.GetUserPermissions
		s.fetchFacilityRoles = d.Queries.GetUserFacilityRoles
	}
	return s
}

// Handler builds the full http.Handler: /api/* first, SPA fallback at /*.
func (s *Server) Handler() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)

	api := chi.NewRouter()
	api.Get("/health", s.handleHealth)

	// Swagger UI (dev only): interactive OpenAPI docs at /api/docs/index.html.
	if s.cfg.IsDev() {
		api.Get("/docs/*", httpSwagger.Handler(httpSwagger.URL("/api/docs/doc.json")))
	}

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
		r.Get("/charts", s.handleCharts)
		r.Get("/airports/{icao}", s.handleAirport)
		r.Get("/airports/{icao}/weather", s.handleAirportWeather)
	})

	// Admin routes: require system.access on top of authentication.
	api.Group(func(r chi.Router) {
		r.Use(s.requireAuth)
		r.Use(s.requirePermission(seed.PermSystemAccess))
		r.Get("/admin/facilities", s.handleAdminFacilities)
	})

	r.Mount("/api", api)
	r.Handle("/*", s.spaHandler())
	return r
}
