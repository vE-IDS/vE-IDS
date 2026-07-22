/**
 * WebSocket protocol types (must match the Go feed package's protocol.go).
 * Three live things flow over the socket: datafeed projections, ATIS updates
 * (pushed only when an ATIS changes), and controller-connection deltas.
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

/**
 * One vNAS controller connection, projected per staffed position. A controller
 * on combined positions appears once per position; `positionId` is the key.
 * Real names are not carried (PII).
 */
export interface ControllerConnection {
  cid: string
  callsign: string
  artccId: string
  facilityId: string
  facilityName: string
  positionId: string
  positionName: string
  radioName: string
  positionType: string
  frequency: string
  isPrimary: boolean
  isActive: boolean
  isObserver: boolean
  loginTime: string
}

/** Sent once on connect with the full current state. */
export interface SnapshotMessage {
  type: 'snapshot'
  ts: number
  data: {
    datafeed: DatafeedProjection | null
    atis: AirportWeather[]
    controllers: ControllerConnection[]
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

/**
 * Controller delta — connections that logged on/changed (`upserted`) and
 * position ids that logged off (`removed`) this tick.
 */
export interface ControllersMessage {
  type: 'controllers'
  ts: number
  data: {
    upserted: ControllerConnection[]
    removed: string[]
  }
}

export type WSMessage =
  | SnapshotMessage
  | DatafeedMessage
  | AtisMessage
  | ControllersMessage
