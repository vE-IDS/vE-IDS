// Package config loads all runtime configuration from the environment (12-factor).
// It is parsed once in main and passed down; no other package reads os.Getenv.
package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config is the fully-resolved application configuration.
type Config struct {
	Env        string // "dev" or "prod"
	Port       string
	AppBaseURL string // public origin, e.g. https://ids.example.com — used for redirect URIs, cookie domain, WS origin check

	DatabaseURL string

	// VATSIM Connect OAuth.
	VatsimAuthURL      string
	VatsimClientID     string
	VatsimClientSecret string
	VatsimRedirectURI  string
	VatsimScopes       string

	// JWT / sessions.
	JWTSigningKey   string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
	CookieDomain    string

	// Upstream feeds.
	DatafeedURL           string
	DatafeedPollInterval  time.Duration
	MetarURL              string
	ChartsAPIURL          string
	ChartsCacheTTL        time.Duration
	VnasControllerFeedURL string // vNAS controller feed (env-specific; live by default)

	// VATUSA (facility roster / staff).
	VatusaAPIURL       string
	VatusaAPIKey       string // optional; the endpoints we use are public
	VatusaSyncInterval time.Duration
}

// IsDev reports whether the app is running in development mode (affects logging
// and the Secure cookie flag).
func (c Config) IsDev() bool { return c.Env == "dev" }

// Load reads configuration from the environment. In dev it first loads a local
// .env file if present (never in prod). It returns an error if a required
// variable is missing.
func Load() (Config, error) {
	// Best-effort: a missing .env is fine (prod injects real env vars).
	_ = godotenv.Load()

	c := Config{
		Env:                   getenv("ENV", "dev"),
		Port:                  getenv("PORT", "8080"),
		AppBaseURL:            getenv("APP_BASE_URL", "http://localhost:8080"),
		DatabaseURL:           os.Getenv("DATABASE_URL"),
		VatsimAuthURL:         getenv("VATSIM_AUTH_URL", "https://auth-dev.vatsim.net"),
		VatsimClientID:        os.Getenv("VATSIM_CLIENT_ID"),
		VatsimClientSecret:    os.Getenv("VATSIM_CLIENT_SECRET"),
		VatsimRedirectURI:     os.Getenv("VATSIM_REDIRECT_URI"),
		VatsimScopes:          getenv("VATSIM_SCOPES", "full_name email vatsim_details country"),
		JWTSigningKey:         os.Getenv("JWT_SIGNING_KEY"),
		AccessTokenTTL:        getdur("ACCESS_TOKEN_TTL", 15*time.Minute),
		RefreshTokenTTL:       getdur("REFRESH_TOKEN_TTL", 30*24*time.Hour),
		CookieDomain:          os.Getenv("COOKIE_DOMAIN"),
		DatafeedURL:           getenv("DATAFEED_URL", "https://data.vatsim.net/v3/vatsim-data.json"),
		DatafeedPollInterval:  getdur("DATAFEED_POLL_INTERVAL", 15*time.Second),
		MetarURL:              getenv("METAR_URL", "https://aviationweather.gov/api/data/metar"),
		ChartsAPIURL:          getenv("CHARTS_API_URL", "https://api-v2.aviationapi.com/v2"),
		ChartsCacheTTL:        getdur("CHARTS_CACHE_TTL", 24*time.Hour),
		VnasControllerFeedURL: getenv("VNAS_CONTROLLER_FEED_URL", "https://live.env.vnas.vatsim.net/data-feed/controllers.json"),
		VatusaAPIURL:          getenv("VATUSA_API_URL", "https://api.vatusa.net/v2"),
		VatusaAPIKey:          os.Getenv("VATUSA_API_KEY"),
		VatusaSyncInterval:    getdur("VATUSA_SYNC_INTERVAL", 2*time.Hour),
	}

	// Default the redirect URI from the base URL when not explicitly set.
	if c.VatsimRedirectURI == "" {
		c.VatsimRedirectURI = strings.TrimRight(c.AppBaseURL, "/") + "/api/auth/vatsim/callback"
	}

	var missing []string
	for name, val := range map[string]string{
		"DATABASE_URL":         c.DatabaseURL,
		"VATSIM_CLIENT_ID":     c.VatsimClientID,
		"VATSIM_CLIENT_SECRET": c.VatsimClientSecret,
		"JWT_SIGNING_KEY":      c.JWTSigningKey,
	} {
		if val == "" {
			missing = append(missing, name)
		}
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}

	return c, nil
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getdur(key string, def time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return def
}
