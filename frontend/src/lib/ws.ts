import type { WSMessage } from '@/types/feed'

/** Live-connection status for UI indicators. */
export type LiveStatus = 'connecting' | 'open' | 'closed'

export interface LiveSocketHandlers {
  onMessage: (msg: WSMessage) => void
  onStatus?: (status: LiveStatus) => void
}

/** Same-origin WebSocket URL for the live feed (proxied to Go in dev). */
export function liveSocketUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/api/ws`
}

/**
 * Open the live WebSocket with automatic reconnect (capped exponential backoff).
 * Returns a disposer that permanently closes the connection.
 */
export function connectLiveSocket(handlers: LiveSocketHandlers): () => void {
  let ws: WebSocket | null = null
  let disposed = false
  let attempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined

  const open = () => {
    if (disposed) return
    handlers.onStatus?.('connecting')
    ws = new WebSocket(liveSocketUrl())

    ws.onopen = () => {
      attempt = 0
      handlers.onStatus?.('open')
    }
    ws.onmessage = (ev) => {
      try {
        handlers.onMessage(JSON.parse(ev.data as string) as WSMessage)
      } catch {
        // Ignore malformed frames.
      }
    }
    ws.onclose = () => {
      handlers.onStatus?.('closed')
      if (disposed) return
      attempt += 1
      const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5))
      reconnectTimer = setTimeout(open, delay)
    }
    ws.onerror = () => {
      ws?.close()
    }
  }

  open()

  return () => {
    disposed = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    ws?.close()
  }
}
