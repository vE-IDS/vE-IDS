/**
 * DTO for a single airport's ATIS + weather. Wire-compatible with the Go API's
 * atis.Report (pushed over the WebSocket) — do not diverge the field names.
 */

/** Decoded surface wind. */
export interface AirportWind {
  /** Direction in degrees as a 3-char string, or `VRB` for variable. */
  direction: string
  /** Speed in knots. */
  speed: number
  /** Gust in knots, if reported. */
  gust?: number
}

/** Combined ATIS + METAR view of one airport. */
export interface AirportWeather {
  /** ICAO identifier, upper-cased (e.g. `KATL`). */
  icao: string
  /** Human-readable airport name, if resolved. */
  airportName?: string
  /** Whether a VATSIM ATIS position is online for this airport. */
  atisAvailable: boolean
  /** The ATIS information letter (A–Z), if an ATIS is online. */
  atisLetter?: string
  /** Full concatenated ATIS text; `undefined` in the METAR-only fallback. */
  atisText?: string
  /** Raw METAR string (may be empty if the METAR lookup failed). */
  metar: string
  /** Flight category derived from the METAR (falls back to ATIS text). */
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR'
  /** Surface wind, if parseable. */
  wind?: AirportWind
  /** Altimeter setting in inHg, if parseable. */
  altimeter?: number
}
