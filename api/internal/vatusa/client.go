// Package vatusa is a typed client for the VATUSA API (api.vatusa.net/v2).
//
// The published OpenAPI spec is too low-fidelity to generate a usable client
// from (empty schema properties, response bodies not linked to endpoints, path
// params mislabeled as query params, missing /v2 base), so this is hand-written
// following the same convention as internal/vatsim: decode only the fields the
// app uses, into small typed structs.
package vatusa

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// Client calls the VATUSA API. Construct with New and share it (the underlying
// http.Client is safe for concurrent use).
type Client struct {
	http    *http.Client
	baseURL string
	apiKey  string // optional; only needed for authenticated fields we don't use yet
}

// New returns a Client for the given base URL (e.g. https://api.vatusa.net/v2).
// apiKey may be empty — the facility list and roster endpoints we use are public.
func New(baseURL, apiKey string) *Client {
	return &Client{
		http:    &http.Client{Timeout: 15 * time.Second},
		baseURL: strings.TrimRight(baseURL, "/"),
		apiKey:  apiKey,
	}
}

// getJSON performs a GET against baseURL+path and decodes the body into out. It
// attaches the API key as the `apikey` query param when configured.
func (c *Client) getJSON(ctx context.Context, path string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return err
	}
	if c.apiKey != "" {
		q := req.URL.Query()
		q.Set("apikey", c.apiKey)
		req.URL.RawQuery = q.Encode()
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("status %d", resp.StatusCode)
	}
	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		return fmt.Errorf("decode: %w", err)
	}
	return nil
}
