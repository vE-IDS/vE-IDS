import type { AirportWind } from '@/types/weather.type'

/**
 * Pure display formatters for airport weather. (The old app's server-side
 * builders — buildAirportWeather / mergeAtisText — now live in the Go API's
 * atis package; the client only needs these formatters.)
 */

/** Format wind for display, e.g. `"270@15G25KT"`, `"Calm"`, or `"—"` when absent. */
export function formatWind(wind?: AirportWind): string {
  if (!wind) return '—'
  if (wind.direction !== 'VRB' && wind.speed === 0) return 'Calm'
  const gust = wind.gust ? `G${wind.gust}` : ''
  return `${wind.direction}@${wind.speed}${gust}KT`
}

/** Format an inHg altimeter as a METAR-style group, e.g. `"A2992"`, or `"—"`. */
export function formatAltimeter(altimeter?: number): string {
  if (altimeter === undefined) return '—'
  return 'A' + Math.round(altimeter * 100).toString().padStart(4, '0')
}
