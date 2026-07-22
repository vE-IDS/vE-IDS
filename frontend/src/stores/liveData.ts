import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import { connectLiveSocket } from '@/lib/ws'
import type { LiveStatus } from '@/lib/ws'
import type { ControllerConnection, DatafeedProjection, WSMessage } from '@/types/feed'
import type { AirportWeather } from '@/types/weather.type'
import { useAuth } from '@/hooks/useAuth'

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
  controllersByPositionId: Record<string, ControllerConnection>
  lastMessageAt: number | null
  dispose: (() => void) | null
  connect: () => () => void
}

export const useLiveStore = create<LiveState>((set, get) => ({
  status: 'connecting',
  datafeed: null,
  atisByIcao: {},
  controllersByPositionId: {},
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
            const nextAtis: Record<string, AirportWeather> = {}
            for (const r of msg.data.atis) nextAtis[r.icao.toUpperCase()] = r
            const nextControllers: Record<string, ControllerConnection> = {}
            for (const c of msg.data.controllers) nextControllers[c.positionId] = c
            set({
              datafeed: msg.data.datafeed ?? get().datafeed,
              atisByIcao: nextAtis,
              controllersByPositionId: nextControllers,
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
          case 'controllers':
            set((s) => {
              const next = { ...s.controllersByPositionId }
              for (const c of msg.data.upserted) next[c.positionId] = c
              for (const id of msg.data.removed) delete next[id]
              return { controllersByPositionId: next, lastMessageAt: now }
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

/** All current controller connections (one entry per staffed position). */
export function useControllers(): ControllerConnection[] {
  return useLiveStore(useShallow((s) => Object.values(s.controllersByPositionId)))
}

/**
 * The logged-in user's active primary position, or null when they aren't
 * actively controlling (offline, observing, or an inactive session). Drives the
 * navbar session indicator.
 */
export function useMyPosition(): ControllerConnection | null {
  const { user } = useAuth()
  const cid = user?.cid ?? null
  return useLiveStore((s) => {
    if (!cid) return null
    return (
      Object.values(s.controllersByPositionId).find(
        (c) => c.cid === cid && c.isPrimary && c.isActive && !c.isObserver,
      ) ?? null
    )
  })
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
