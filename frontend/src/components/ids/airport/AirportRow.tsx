import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { FileText, Info, Map as MapIcon, X } from 'lucide-react'
import { toast } from 'sonner'

import { apiFetch } from '@/lib/api'
import type { AirportWeather } from '@/types/weather.type'
import { Switch } from '@/components/ui/switch'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getFlightCategoryColor } from '@/lib/atisParser'
import { formatAltimeter, formatWind } from '@/lib/weather'
import { useAtis } from '@/hooks/useLiveData'
import AtisView from './AtisView'
import CompactView from './CompactView'
import type { AirportEntry } from './types'

/**
 * One airport within the Airports panel. Reads the airport's ATIS from the live
 * WebSocket feed (via useAtis), renders a control strip (ICAO · Compact · remove),
 * and delegates the body to CompactView or AtisView. Right-clicking the row opens
 * a context menu to jump to the airport's charts / info or view the full ATIS.
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
  const wsData = useAtis(entry.icao)
  const navigate = useNavigate()
  const [atisOpen, setAtisOpen] = useState(false)

  // When no ATIS is online (not carried on the WS), fall back to a METAR-only
  // report from the REST endpoint.
  const { data: fallback } = useQuery({
    queryKey: ['airport-weather', entry.icao],
    enabled: !wsData,
    queryFn: () => apiFetch<AirportWeather>(`/airports/${entry.icao}/weather`),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
  const data = wsData ?? fallback ?? null

  const copyMetar = () => {
    if (!data?.metar) return
    void navigator.clipboard.writeText(data.metar)
    toast.success(`Copied ${entry.icao} METAR`)
  }

  const controls = (
    <div className="panel-no-drag flex items-center gap-1">
      <Switch checked={entry.compact} onCheckedChange={onToggleCompact} aria-label="Compact view" />
      <button
        type="button"
        aria-label={`Remove ${entry.icao}`}
        onClick={onRemove}
        className="cursor-pointer rounded p-0.5 text-white/60 transition hover:bg-black/40 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  )

  return (
    <>
      <ContextMenu modal={false}>
        <ContextMenuTrigger asChild>
          <div className="flex flex-col gap-1 bg-secondary p-2">
            {entry.compact ? (
              <div className="flex items-center gap-2">
                <CompactView icao={entry.icao} data={data} />
                {controls}
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                {/* ATIS tile: letter + flight category in the category color.
                    Fixed square so every card's tile is the same size. */}
                <div
                  className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-sm drop-shadow-md ${
                    data?.atisAvailable ? getFlightCategoryColor(data.flightCategory) : 'bg-gray'
                  }`}
                >
                  <span className="text-3xl leading-none font-bold text-white">
                    {data?.atisLetter ?? '—'}
                  </span>
                  {data?.atisAvailable && (
                    <span className="text-[9px] font-bold tracking-widest text-white/90">
                      {data.flightCategory}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {/* Airport code + coded weather share the top baseline. */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{entry.icao}</span>
                    <span className="ml-auto flex items-center gap-2 font-mono text-xs text-muted-foreground tabular-nums">
                      <span>{formatWind(data?.wind)}</span>
                      <span>{formatAltimeter(data?.altimeter)}</span>
                    </span>
                    {controls}
                  </div>
                  <AtisView data={data} />
                </div>
              </div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-52">
          <ContextMenuLabel>{entry.icao}</ContextMenuLabel>
          <ContextMenuItem
            onSelect={() => navigate({ to: '/ids/charts', search: { airport: entry.icao } })}
          >
            <MapIcon size={14} /> View charts
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => navigate({ to: '/ids/info/$icao', params: { icao: entry.icao } })}
          >
            <Info size={14} /> Airport info
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem disabled={!data?.atisText} onSelect={() => setAtisOpen(true)}>
            <FileText size={14} /> View full ATIS
          </ContextMenuItem>
          <ContextMenuItem disabled={!data?.metar} onSelect={copyMetar}>
            Copy METAR
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={atisOpen} onOpenChange={setAtisOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {entry.icao} ATIS {data?.atisLetter ? `· Info ${data.atisLetter}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {data?.metar && (
              <p className="mb-3 font-mono text-xs text-muted-foreground">{data.metar}</p>
            )}
            <p className="text-sm whitespace-pre-wrap">
              {data?.atisText || 'No ATIS text available.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
