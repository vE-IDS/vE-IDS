package vatsim

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

// FetchDatafeed retrieves and decodes the VATSIM v3 datafeed.
func (c *Client) FetchDatafeed(ctx context.Context) (*Datafeed, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.datafeedURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch datafeed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("datafeed status %d", resp.StatusCode)
	}

	var d Datafeed
	if err := json.NewDecoder(resp.Body).Decode(&d); err != nil {
		return nil, fmt.Errorf("decode datafeed: %w", err)
	}
	return &d, nil
}
