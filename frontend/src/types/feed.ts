/**
 * WebSocket protocol types (must match the Go feed package's protocol.go).
 * Only two live things flow over the socket: datafeed projections and ATIS
 * updates (pushed only when an ATIS changes).
 */
import type { AirportWeather } from './weather.type'

/** Slim per-aircraft projection the map renders. */
export interface PilotMarker {
  callsign: string
  lat: number
  lon: number
  heading: number
  altitude: number
  groundspeed: number
  departure?: string
  arrival?: string
  aircraft?: string
}

/** Trimmed datafeed pushed to clients. */
export interface DatafeedProjection {
  updateTimestamp: string
  connectedClients: number
  pilots: PilotMarker[]
}

/** Sent once on connect with the full current state. */
export interface SnapshotMessage {
  type: 'snapshot'
  ts: number
  data: {
    datafeed: DatafeedProjection | null
    atis: AirportWeather[]
  }
}

/** A datafeed projection update. */
export interface DatafeedMessage {
  type: 'datafeed'
  ts: number
  data: DatafeedProjection
}

/** ATIS delta — only the stations that changed this tick. */
export interface AtisMessage {
  type: 'atis'
  ts: number
  data: AirportWeather[]
}

export type WSMessage = SnapshotMessage | DatafeedMessage | AtisMessage
