import { getFlightCategoryColor, parseAtis } from '@/lib/atisParser'
import type { AirportWeather } from '@/types/weather.type'

/**
 * Full ATIS body for one airport: the information letter in a flight-category–
 * colored box, the METAR, and departing/arriving runways parsed from the ATIS
 * text. When no ATIS is online (data is null in the WS model) it shows a muted
 * note. Body only — the enclosing AirportRow provides the per-airport controls.
 */
export default function AtisView({ data }: { data: AirportWeather | null }) {
  const runways = data?.atisText ? parseAtis(data.atisText).runways : undefined

  return (
    <div className="flex flex-row gap-x-2.5">
      <div className="flex flex-col items-center">
        <div
          className={`${data?.atisAvailable ? getFlightCategoryColor(data.flightCategory) : 'bg-gray'} relative flex h-16 w-16 items-center justify-center drop-shadow-md`}
        >
          <h3 className="text-4xl font-normal">{data?.atisLetter ?? '—'}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {!data ? (
          <span className="text-xs text-muted-foreground">No ATIS online on VATSIM</span>
        ) : (
          <>
            {data.airportName && <span className="text-xs text-muted-foreground">{data.airportName}</span>}
            {!data.atisAvailable && (
              <span className="text-xs text-muted-foreground">No ATIS on VATSIM — METAR only</span>
            )}
            <h6 className="mb-2 w-9/10">{data.metar || 'METAR unavailable'}</h6>

            <div className="flex flex-row gap-x-10">
              {runways?.departureRunways && runways.departureRunways.length > 0 && (
                <div>
                  <p className="mb-0.5 font-bold">Departing</p>
                  <div className="flex flex-row gap-x-2">
                    {runways.departureRunways.map((r, i) => (
                      <p className="approach-box py-0.5" key={i}>
                        {r}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {runways?.landingRunways && runways.landingRunways.length > 0 && (
                <div>
                  <p className="mb-0.5 font-bold">Arriving</p>
                  <div className="flex flex-row gap-x-2">
                    {runways.landingRunways.map((r, i) => (
                      <p className="approach-box py-0.5" key={i}>
                        {r}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
