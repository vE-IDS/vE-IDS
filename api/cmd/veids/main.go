// Command veids is the vE-IDS API server: it owns Postgres + migrations, the
// VATSIM OAuth→JWT auth, the REST endpoints, the datafeed poller + WebSocket hub,
// and (in prod) serves the embedded static SPA.
package main

import (
	"context"
	"errors"
	"io/fs"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"veids/api/internal/auth"
	"veids/api/internal/config"
	"veids/api/internal/db"
	"veids/api/internal/db/seed"
	"veids/api/internal/db/sqlc"
	"veids/api/internal/facility"
	"veids/api/internal/feed"
	"veids/api/internal/httpx"
	applog "veids/api/internal/log"
	"veids/api/internal/vatsim"
	"veids/api/internal/vatusa"
	"veids/api/internal/vnas"
	"veids/api/web"
)

// @title           vE-IDS API
// @version         1.0
// @description     The vE-IDS controller IDS API: VATSIM OAuth authentication, saved dashboards, charts/airport info, a live datafeed/ATIS WebSocket, and facility administration. All non-auth endpoints require the access-JWT cookie.
// @BasePath        /api
//
// @securityDefinitions.apikey  CookieAuth
// @in                          cookie
// @name                        veids_at
func main() {
	if err := run(); err != nil {
		// logger may not exist yet; stderr is fine for a fatal startup error.
		println("fatal:", err.Error())
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	logger := applog.New(cfg.IsDev())

	// Root context cancelled on SIGINT/SIGTERM for graceful shutdown.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Database + migrations.
	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()
	if err := db.Migrate(ctx, pool); err != nil {
		return err
	}
	logger.Info("migrations applied")

	queries := sqlc.New(pool)

	// Modular reference-data seeding. Runs on every boot (idempotent upserts) so
	// the baseline permission/role model is always present and self-healing.
	if err := seed.RunAll(ctx, queries, logger); err != nil {
		return err
	}

	// Auth building blocks.
	jwtMgr := auth.NewJWTManager(cfg.JWTSigningKey, cfg.AccessTokenTTL)
	refreshMgr := auth.NewRefreshManager(queries, cfg.RefreshTokenTTL)
	cookieMgr := auth.NewCookieManager(!cfg.IsDev(), cfg.CookieDomain, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)
	oauthClient := auth.NewOAuthClient(cfg.VatsimAuthURL, cfg.VatsimClientID, cfg.VatsimClientSecret, cfg.VatsimRedirectURI, cfg.VatsimScopes)

	// Feed poller + WebSocket hub.
	vatsimClient := vatsim.New(cfg.DatafeedURL, cfg.MetarURL, cfg.ChartsAPIURL)
	vnasClient := vnas.New(cfg.VnasControllerFeedURL)
	store := feed.NewStore()
	hub := feed.NewHub(logger)
	poller := feed.NewPoller(vatsimClient, vnasClient, store, hub, queries, cfg.DatafeedPollInterval, logger)
	poller.SeedFromDB(ctx)

	go hub.Run(ctx)
	go poller.Run(ctx)

	// VATUSA facility/staff sync: seeds facilities + access grants on boot, then
	// refreshes every VatusaSyncInterval. Failures are logged, not fatal.
	vatusaClient := vatusa.New(cfg.VatusaAPIURL, cfg.VatusaAPIKey)
	syncer := facility.NewSyncer(vatusaClient, pool, queries, cfg.VatusaSyncInterval, logger)
	go syncer.Run(ctx)

	// Static SPA: embedded in prod, served by Vite in dev.
	var static fs.FS
	if !cfg.IsDev() {
		if sub, err := web.DistFS(); err == nil {
			static = sub
		} else {
			logger.Warn("embedded SPA unavailable", "err", err)
		}
	}

	server := httpx.New(httpx.Deps{
		Config:  cfg,
		Logger:  logger,
		Pool:    pool,
		Queries: queries,
		JWT:     jwtMgr,
		Refresh: refreshMgr,
		Cookies: cookieMgr,
		OAuth:   oauthClient,
		Hub:     hub,
		Store:   store,
		Vatsim:  vatsimClient,
		Static:  static,
	})

	httpServer := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           server.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Run the server; shut it down cleanly when ctx is cancelled.
	serverErr := make(chan error, 1)
	go func() {
		logger.Info("listening", "port", cfg.Port, "env", cfg.Env)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	select {
	case err := <-serverErr:
		return err
	case <-ctx.Done():
		logger.Info("shutting down")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return httpServer.Shutdown(shutdownCtx)
	}
}
