package feed

import (
	"context"
	"log/slog"
)

// Hub owns the set of connected WebSocket clients and fans broadcasts out to
// them. A single goroutine (Run) owns the client map, so no locking is needed.
type Hub struct {
	logger     *slog.Logger
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	clients    map[*Client]struct{}
	done       chan struct{}
}

// NewHub constructs a Hub. Call Run in a goroutine to start it.
func NewHub(logger *slog.Logger) *Hub {
	return &Hub{
		logger:     logger,
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte, 16),
		clients:    make(map[*Client]struct{}),
		done:       make(chan struct{}),
	}
}

// Run services the hub until ctx is cancelled. It owns the client map.
func (h *Hub) Run(ctx context.Context) {
	defer close(h.done)
	for {
		select {
		case <-ctx.Done():
			return
		case c := <-h.register:
			h.clients[c] = struct{}{}
		case c := <-h.unregister:
			if _, ok := h.clients[c]; ok {
				delete(h.clients, c)
				close(c.send)
			}
		case msg := <-h.broadcast:
			for c := range h.clients {
				select {
				case c.send <- msg:
				default:
					// Slow consumer: drop it rather than block the hub.
					delete(h.clients, c)
					close(c.send)
					c.dropped()
				}
			}
		}
	}
}

func (h *Hub) register_(c *Client) {
	select {
	case h.register <- c:
	case <-h.done:
	}
}

func (h *Hub) unregister_(c *Client) {
	select {
	case h.unregister <- c:
	case <-h.done:
	}
}

// Broadcast enqueues a pre-marshaled message for delivery to all clients.
func (h *Hub) Broadcast(msg []byte) {
	select {
	case h.broadcast <- msg:
	case <-h.done:
	}
}
