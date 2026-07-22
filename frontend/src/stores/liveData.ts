import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import { connectLiveSocket } from '@/lib/ws'
import type { LiveStatus } from '@/lib/ws'
import type { DatafeedProjection, WSMessage } from '@/types/feed'
import type { AirportWeather } from '@/types/weather.type'

/**
 * Long-lived live-data store (Zustand). Holds the single WebSocket's latest
 * datafeed projection, per-ICAO ATIS reports, connection status, and the time of
 * the last received frame (for freshness). `connect()` opens the socket once and
 * is idempotent; it returns a disposer.
 */
interface LiveState {
  status: LiveStatus
  datafeed: DatafeedProjection | null
  atisByIcao: Record<string, AirportWeather>
  lastMessageAt: number | null
  dispose: (() => void) | null
  connect: () => () => void
}

export const useLiveStore = create<LiveState>((set, get) => ({
  status: 'connecting',
  datafeed: null,
  atisByIcao: {},
  lastMessageAt: null,
  dispose: null,

  connect: () => {
    const existing = get().dispose
    if (existing) return existing

    const raw = connectLiveSocket({
      onStatus: (status) => set({ status }),
      onMessage: (msg: WSMessage) => {
        const now = Date.now()
        switch (msg.type) {
          case 'snapshot': {
            const next: Record<string, AirportWeather> = {}
            for (const r of msg.data.atis) next[r.icao.toUpperCase()] = r
            set({
              datafeed: msg.data.datafeed ?? get().datafeed,
              atisByIcao: next,
              lastMessageAt: now,
            })
            break
          }
          case 'datafeed':
            set({ datafeed: msg.data, lastMessageAt: now })
            break
          case 'atis':
            set((s) => {
              const next = { ...s.atisByIcao }
              for (const r of msg.data) next[r.icao.toUpperCase()] = r
              return { atisByIcao: next, lastMessageAt: now }
            })
            break
        }
      },
    })

    const dispose = () => {
      raw()
      set({ dispose: null })
    }
    set({ dispose })
    return dispose
  },
}))

/** ATIS + weather for one ICAO, or null if no ATIS is online for it. */
export function useAtis(icao: string): AirportWeather | null {
  return useLiveStore((s) => s.atisByIcao[icao.toUpperCase()] ?? null)
}

/** The latest datafeed projection (pilots/counts), or null before first tick. */
export function useDatafeed(): DatafeedProjection | null {
  return useLiveStore((s) => s.datafeed)
}

/** The live connection status, for UI indicators. */
export function useLiveStatus(): LiveStatus {
  return useLiveStore((s) => s.status)
}

/** Datafeed freshness snapshot for the status popover. */
export function useLiveFreshness() {
  return useLiveStore(
    useShallow((s) => ({
      lastMessageAt: s.lastMessageAt,
      updateTimestamp: s.datafeed?.updateTimestamp ?? null,
      connectedClients: s.datafeed?.connectedClients ?? null,
    })),
  )
}
