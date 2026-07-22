import type { PanelComponentProps } from '@/components/panels/registry'
import AirportAdder from './AirportAdder'
import AirportRow from './AirportRow'
import { readAirports  } from './types'
import type {AirportEntry} from './types';

/**
 * Airports grid panel: a user-curated list of airports (ATIS + weather). Each
 * airport reads its live ATIS from the WebSocket feed. The list lives in
 * `settings.airports` and persists with the dashboard layout.
 */
export default function AirportPanel({ settings, onSettingsChange }: PanelComponentProps) {
  const airports = readAirports(settings)

  const save = (next: AirportEntry[]) => onSettingsChange({ airports: next })

  const addIcao = (icao: string) => {
    if (airports.some((a) => a.icao === icao)) return
    save([...airports, { icao, compact: false }])
  }
  const removeIcao = (icao: string) => save(airports.filter((a) => a.icao !== icao))
  const setCompact = (icao: string, compact: boolean) =>
    save(airports.map((a) => (a.icao === icao ? { ...a, compact } : a)))

  return (
    <div className="flex h-full flex-col gap-2">
      <AirportAdder onAdd={addIcao} />
      {airports.length === 0 ? (
        <p className="text-muted-foreground">Add an airport to see its ATIS &amp; weather.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {airports.map((entry) => (
            <AirportRow
              key={entry.icao}
              entry={entry}
              onToggleCompact={(compact) => setCompact(entry.icao, compact)}
              onRemove={() => removeIcao(entry.icao)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
