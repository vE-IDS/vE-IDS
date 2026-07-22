import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { connectLiveSocket  } from '@/lib/ws'
import type {LiveStatus} from '@/lib/ws';
import type { DatafeedProjection, WSMessage } from '@/types/feed'
import type { AirportWeather } from '@/types/weather.type'

interface LiveData {
  status: LiveStatus
  datafeed: DatafeedProjection | null
  atisByIcao: Record<string, AirportWeather>
}

const LiveDataContext = createContext<LiveData | null>(null)

/**
 * Opens the single live WebSocket for the IDS and exposes the datafeed
 * projection and per-ICAO ATIS reports. `snapshot` replaces the ATIS map;
 * `atis` deltas merge by ICAO; `datafeed` updates the projection.
 */
export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LiveStatus>('connecting')
  const [datafeed, setDatafeed] = useState<DatafeedProjection | null>(null)
  const [atisByIcao, setAtisByIcao] = useState<Record<string, AirportWeather>>({})

  // Keep the message handler stable across reconnects.
  const handleMessage = useRef((msg: WSMessage) => {
    switch (msg.type) {
      case 'snapshot': {
        if (msg.data.datafeed) setDatafeed(msg.data.datafeed)
        const next: Record<string, AirportWeather> = {}
        for (const r of msg.data.atis) next[r.icao.toUpperCase()] = r
        setAtisByIcao(next)
        break
      }
      case 'datafeed':
        setDatafeed(msg.data)
        break
      case 'atis':
        setAtisByIcao((prev) => {
          const next = { ...prev }
          for (const r of msg.data) next[r.icao.toUpperCase()] = r
          return next
        })
        break
    }
  })

  useEffect(() => {
    const dispose = connectLiveSocket({
      onMessage: (m) => handleMessage.current(m),
      onStatus: setStatus,
    })
    return dispose
  }, [])

  const value = useMemo<LiveData>(
    () => ({ status, datafeed, atisByIcao }),
    [status, datafeed, atisByIcao],
  )

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>
}

function useLiveData(): LiveData {
  const ctx = useContext(LiveDataContext)
  if (!ctx) throw new Error('useLiveData must be used within a LiveDataProvider')
  return ctx
}

/** ATIS + weather for one ICAO, or null if no ATIS is online for it. */
export function useAtis(icao: string): AirportWeather | null {
  const { atisByIcao } = useLiveData()
  return atisByIcao[icao.toUpperCase()] ?? null
}

/** The latest datafeed projection (pilots/counts), or null before first tick. */
export function useDatafeed(): DatafeedProjection | null {
  return useLiveData().datafeed
}

/** The live connection status, for UI indicators. */
export function useLiveStatus(): LiveStatus {
  return useLiveData().status
}
