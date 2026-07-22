/**
 * Per-airport entry stored in the Airports panel's `settings.airports`.
 * `compact` selects that airport's display individually.
 */
export interface AirportEntry {
  icao: string
  compact: boolean
}

/** Safely read the airports array from opaque panel settings. */
export function readAirports(settings?: Record<string, unknown>): AirportEntry[] {
  const raw = settings?.airports
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (e): e is AirportEntry =>
      !!e && typeof (e as AirportEntry).icao === 'string' && typeof (e as AirportEntry).compact === 'boolean',
  )
}
