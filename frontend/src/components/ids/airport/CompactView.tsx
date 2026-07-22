import { getFlightCategoryTextColor } from '@/lib/atisParser'
import { formatAltimeter, formatWind } from '@/lib/weather'
import type { AirportWeather } from '@/types/weather.type'

/**
 * One-line compact body: ATIS letter (colored by flight category, omitted when
 * no ATIS) · wind · altimeter. Body only.
 */
export default function CompactView({ data }: { data: AirportWeather | null }) {
  return (
    <div className="flex flex-row items-center gap-3 text-xs">
      {data?.atisAvailable && data.atisLetter && (
        <span className={`font-bold ${getFlightCategoryTextColor(data.flightCategory)}`}>{data.atisLetter}</span>
      )}
      <span className="text-muted-foreground">{formatWind(data?.wind)}</span>
      <span className="text-muted-foreground">{formatAltimeter(data?.altimeter)}</span>
    </div>
  )
}
