import { parseAtis } from '@/lib/atisParser'
import type { AirportWeather } from '@/types/weather.type'

/**
 * Compact ATIS body: the METAR and the runways in use, meant to sit between the
 * ICAO and the ATIS code in the row header (those two are rendered by AirportRow).
 * When no ATIS is online (data is null) it shows a muted note.
 */
export default function AtisView({ data }: { data: AirportWeather | null }) {
  if (!data) {
    return <span className="text-xs text-muted-foreground">No ATIS online on VATSIM</span>
  }

  const runways = data.atisText ? parseAtis(data.atisText).runways : undefined
  const hasRunways =
    !!runways && (runways.departureRunways.length > 0 || runways.landingRunways.length > 0)

  return (
    <div className="flex flex-col gap-1">
      {data.airportName && (
        <span className="text-[11px] text-muted-foreground">{data.airportName}</span>
      )}
      {!data.atisAvailable && (
        <span className="text-[11px] text-muted-foreground">No ATIS on VATSIM — METAR only</span>
      )}

      <span className="font-mono text-[11px] leading-snug break-words">
        {data.metar || 'METAR unavailable'}
      </span>

      {hasRunways && (
        <div className="flex flex-row flex-wrap items-center gap-x-6 gap-y-1 text-xs">
          {runways.departureRunways.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Dep
              </span>
              {runways.departureRunways.map((r, i) => (
                <span
                  className="rounded-sm bg-mid-gray px-1.5 py-0.5 font-mono text-[11px] leading-none text-foreground"
                  key={`d-${i}`}
                >
                  {r}
                </span>
              ))}
            </div>
          )}
          {runways.landingRunways.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Arr
              </span>
              {runways.landingRunways.map((r, i) => (
                <span
                  className="rounded-sm bg-mid-gray px-1.5 py-0.5 font-mono text-[11px] leading-none text-foreground"
                  key={`a-${i}`}
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
