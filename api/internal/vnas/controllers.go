package vnas

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

// FetchControllers retrieves and decodes the vNAS controller feed.
func (c *Client) FetchControllers(ctx context.Context) (*ControllerFeed, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.feedURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch controller feed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("controller feed status %d", resp.StatusCode)
	}

	var f ControllerFeed
	if err := json.NewDecoder(resp.Body).Decode(&f); err != nil {
		return nil, fmt.Errorf("decode controller feed: %w", err)
	}
	return &f, nil
}
