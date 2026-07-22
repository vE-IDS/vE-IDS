package vatsim

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// FetchCharts returns the raw AviationAPI v2 charts payload for an airport as
// JSON bytes (airport metadata + charts grouped by category). Callers pass this
// through to the client; the REST handler that consumes it is deferred (see
// docs/NOT-DONE.md), but the client is ready.
func (c *Client) FetchCharts(ctx context.Context, icao string) ([]byte, error) {
	u := fmt.Sprintf("%s/charts?airport=%s", c.chartsAPIURL, url.QueryEscape(strings.ToUpper(icao)))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch charts: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("charts status %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}
