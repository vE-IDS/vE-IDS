import { useEffect, useState } from 'react'
import { formatTimeLocal, formatTimeZulu } from '@/lib/date'

/**
 * Zulu + local clock, ticking every second. Renders a fixed-width placeholder
 * before mount so it doesn't shift the navbar layout.
 */
export default function Clock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) return <div className="h-10 w-52" />

  return (
    <div className="flex items-stretch gap-px overflow-hidden rounded border border-gray text-center tabular-nums">
      <div className="bg-light-gray px-3 py-1">
        <div className="text-[10px] uppercase text-muted-foreground">Zulu</div>
        <div className="text-sm font-semibold">{formatTimeZulu(now)}</div>
      </div>
      <div className="bg-light-gray px-3 py-1">
        <div className="text-[10px] uppercase text-muted-foreground">Local</div>
        <div className="text-sm font-semibold">{formatTimeLocal(now)}</div>
      </div>
    </div>
  )
}
