import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * A single countdown timer button. Click to start/stop; counts down from `time`
 * seconds and resets on stop or completion. Scales its text with the panel size
 * (container-query units — TimerPanel sets `container-type: size`).
 */
export default function TimerButton({ time, onRemove }: { time: number; onRemove?: () => void }) {
  const [localTime, setLocalTime] = useState<number>(time)
  const timeStamp = useRef<number | undefined>(undefined)
  const isTimerOn = useRef<boolean>(false)
  const interval = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    setLocalTime(time)
    return () => {
      if (interval.current) clearInterval(interval.current)
    }
  }, [time])

  const toggle = () => {
    isTimerOn.current = !isTimerOn.current

    if (isTimerOn.current) {
      timeStamp.current = Date.now() + time * 1000
      interval.current = setInterval(() => {
        if (!timeStamp.current) return
        const remaining = (timeStamp.current - Date.now()) / 1000
        setLocalTime(remaining)
        if (remaining <= 0) {
          isTimerOn.current = false
          setLocalTime(0)
          if (interval.current) clearInterval(interval.current)
        }
      }, 250)
    } else {
      if (interval.current) clearInterval(interval.current)
      setLocalTime(time)
    }
  }

  const minutes = Math.floor(localTime / 60)
  const seconds = Math.floor(localTime - 60 * minutes)
  const expired = localTime <= 0

  return (
    <div className="relative h-full w-full">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex h-full w-full items-center justify-center rounded border border-border bg-card font-medium tabular-nums transition hover:bg-accent',
          expired ? 'text-destructive' : 'text-amber-500',
        )}
        style={{ fontSize: 'clamp(0.9rem, 18cqmin, 3rem)' }}
      >
        {minutes}:{seconds.toString().padStart(2, '0')}
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label="Remove timer"
          onClick={onRemove}
          className="panel-no-drag absolute right-0.5 top-0.5 cursor-pointer rounded p-0.5 text-white/50 transition hover:bg-black/40 hover:text-white"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
