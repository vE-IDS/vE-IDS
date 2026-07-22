package vatsim

import (
	"net/http"
	"time"
)

// Client fetches the upstream aviation feeds. Construct with New and share it
// (the underlying http.Client is safe for concurrent use).
type Client struct {
	http         *http.Client
	datafeedURL  string
	metarBaseURL string
	chartsAPIURL string
}

// New returns a Client configured with the given upstream URLs.
func New(datafeedURL, metarBaseURL, chartsAPIURL string) *Client {
	return &Client{
		http:         &http.Client{Timeout: 15 * time.Second},
		datafeedURL:  datafeedURL,
		metarBaseURL: metarBaseURL,
		chartsAPIURL: chartsAPIURL,
	}
}
