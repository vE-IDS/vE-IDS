package vatsim

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// FetchMetar retrieves the raw METAR text for an ICAO from aviationweather.gov.
// Returns an empty string (no error) when the lookup fails, mirroring the old
// app's degrade-gracefully behavior.
func (c *Client) FetchMetar(ctx context.Context, icao string) string {
	u := fmt.Sprintf("%s?ids=%s", c.metarBaseURL, url.QueryEscape(strings.ToUpper(icao)))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return ""
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return ""
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(body))
}
