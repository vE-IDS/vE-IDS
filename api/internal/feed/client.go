package feed

import (
	"context"
	"time"

	"github.com/coder/websocket"
)

// Client is one connected WebSocket peer. Messages queued on send are written by
// writePump; readPump drains inbound frames (only to detect close in v1).
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	userID string
}

// Serve registers a newly-accepted connection, sends it the initial snapshot,
// and runs its read/write pumps until the connection closes. It blocks until the
// client disconnects, then unregisters it. Call it from the WS HTTP handler.
func (h *Hub) Serve(ctx context.Context, conn *websocket.Conn, userID string, initial []byte) {
	c := &Client{hub: h, conn: conn, send: make(chan []byte, 32), userID: userID}
	h.register_(c)
	defer h.unregister_(c)

	if initial != nil {
		// Buffer has room; safe before the pumps start.
		c.send <- initial
	}

	go c.writePump(ctx)
	c.readPump(ctx)
}

func (c *Client) writePump(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-c.send:
			if !ok {
				// Hub closed the channel (unregistered / dropped).
				c.conn.Close(websocket.StatusNormalClosure, "")
				return
			}
			wctx, cancel := context.WithTimeout(ctx, 10*time.Second)
			err := c.conn.Write(wctx, websocket.MessageText, msg)
			cancel()
			if err != nil {
				return
			}
		}
	}
}

func (c *Client) readPump(ctx context.Context) {
	for {
		// v1 ignores client->server messages (subscribe is deferred); Read still
		// drives ping/pong and surfaces the close.
		if _, _, err := c.conn.Read(ctx); err != nil {
			return
		}
	}
}

// dropped is called by the hub when this client is evicted as a slow consumer.
func (c *Client) dropped() {
	c.conn.Close(websocket.StatusPolicyViolation, "slow consumer")
}
