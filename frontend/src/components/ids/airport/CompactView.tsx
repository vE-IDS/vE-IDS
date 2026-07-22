import { getFlightCategoryTextColor, parseAtis } from '@/lib/atisParser'
import { formatAltimeter, formatWind } from '@/lib/weather'
import type { AirportWeather } from '@/types/weather.type'

/**
 * One-line compact readout for an airport, e.g.
 * `KMCO R  180@3KT  A2999  DEP 18L  ARR 36L` — ICAO, ATIS letter (colored by
 * flight category when online), wind, altimeter, then the runways in use.
 * Single line; the enclosing AirportRow adds the controls.
 */
export default function CompactView({
  icao,
  data,
}: {
  icao: string
  data: AirportWeather | null
}) {
  const runways = data?.atisText ? parseAtis(data.atisText).runways : undefined
  const dep = runways?.departureRunways ?? []
  const arr = runways?.landingRunways ?? []

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-xs whitespace-nowrap">
      <span className="font-bold text-foreground">{icao}</span>
      {data?.atisAvailable && data.atisLetter && (
        <span className={`text-base leading-none font-bold ${getFlightCategoryTextColor(data.flightCategory)}`}>
          {data.atisLetter}
        </span>
      )}
      <span className="font-mono text-muted-foreground tabular-nums">{formatWind(data?.wind)}</span>
      <span className="font-mono text-muted-foreground tabular-nums">{formatAltimeter(data?.altimeter)}</span>
      {dep.length > 0 && (
        <span className="font-mono text-muted-foreground">
          <span className="mr-1 text-[9px] font-semibold tracking-wide uppercase">Dep</span>
          {dep.join(' ')}
        </span>
      )}
      {arr.length > 0 && (
        <span className="font-mono text-muted-foreground">
          <span className="mr-1 text-[9px] font-semibold tracking-wide uppercase">Arr</span>
          {arr.join(' ')}
        </span>
      )}
    </div>
  )
}
