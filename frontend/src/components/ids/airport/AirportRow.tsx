import { X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useAtis } from '@/hooks/useLiveData'
import AtisView from './AtisView'
import CompactView from './CompactView'
import type { AirportEntry } from './types'

/**
 * One airport within the Airports panel. Reads the airport's ATIS from the live
 * WebSocket feed (via useAtis) rather than a per-row fetch, renders a control
 * strip (ICAO · Compact toggle · remove), and delegates the body to CompactView
 * or AtisView based on `entry.compact`.
 */
export default function AirportRow({
  entry,
  onToggleCompact,
  onRemove,
}: {
  entry: AirportEntry
  onToggleCompact: (compact: boolean) => void
  onRemove: () => void
}) {
  const data = useAtis(entry.icao)

  return (
    <div className="flex flex-col gap-1 bg-secondary p-2">
      <div className="flex flex-row items-center gap-2">
        <span className="text-sm font-semibold">{entry.icao}</span>
        <label className="panel-no-drag ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          Compact
          <Switch size="sm" checked={entry.compact} onCheckedChange={onToggleCompact} />
        </label>
        <button
          type="button"
          aria-label={`Remove ${entry.icao}`}
          onClick={onRemove}
          className="panel-no-drag cursor-pointer rounded p-0.5 text-white/60 transition hover:bg-black/40 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      {entry.compact ? <CompactView data={data} /> : <AtisView data={data} />}
    </div>
  )
}
