import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLiveFreshness, useLiveStatus } from '@/stores/liveData'
import { cn } from '@/lib/utils'

/**
 * Datafeed status popover: connection state + how long since the last datafeed
 * update (green when fresh, amber when stale) + connected-client count.
 */
export default function StatusPopover() {
  const status = useLiveStatus()
  const { lastMessageAt, connectedClients } = useLiveFreshness()

  // Re-render each second so "time since" stays live even without new frames.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const secondsSince = lastMessageAt ? Math.floor((Date.now() - lastMessageAt) / 1000) : null
  const fresh = secondsSince !== null && secondsSince < 60

  const dot =
    status === 'open' ? (fresh ? 'bg-green-500' : 'bg-amber-500') : 'bg-destructive'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <span className={cn('h-2 w-2 rounded-full', dot)} />
          Status
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60">
        <p className="mb-2 text-sm font-semibold">Live datafeed</p>
        <Row label="Connection" value={status} valueClass={status === 'open' ? 'text-green-500' : 'text-amber-500'} />
        <Row
          label="Last update"
          value={secondsSince === null ? '—' : `${secondsSince}s ago`}
          valueClass={fresh ? 'text-green-500' : 'text-amber-500'}
        />
        <Row label="Clients online" value={connectedClients?.toLocaleString() ?? '—'} />
      </PopoverContent>
    </Popover>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', valueClass)}>{value}</span>
    </div>
  )
}
