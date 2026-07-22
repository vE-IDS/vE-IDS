// Package vnas provides a typed client for the vNAS controller data feed
// (https://docs.virtualnas.net/data-admin/controller-feed/). vNAS is the source
// of truth for which controllers are connected and on which structured position
// (ARTCC / facility / position), which the coarse VATSIM datafeed cannot express.
// It decodes only the subset of the payload the app actually uses.
package vnas

import (
	"net/http"
	"time"
)

// Client fetches the vNAS controller feed. Construct with New and share it (the
// underlying http.Client is safe for concurrent use).
type Client struct {
	http    *http.Client
	feedURL string
}

// New returns a Client configured with the given controller-feed URL (the
// environment-specific ".../data-feed/controllers.json" endpoint).
func New(feedURL string) *Client {
	return &Client{
		http:    &http.Client{Timeout: 15 * time.Second},
		feedURL: feedURL,
	}
}
