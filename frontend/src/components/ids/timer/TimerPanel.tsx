import type { PanelComponentProps } from '@/components/panels/registry'
import TimerButton from './TimerButton'
import TimerAdder from './TimerAdder'

/** Timers shown when a panel has no custom set yet (seconds). */
const DEFAULT_TIMERS = [120, 60, 45, 30]

function readTimers(settings?: Record<string, unknown>): number[] {
  const raw = settings?.timers
  if (!Array.isArray(raw)) return DEFAULT_TIMERS
  const nums = raw.filter((n): n is number => typeof n === 'number' && n > 0)
  return nums.length > 0 ? nums : DEFAULT_TIMERS
}

/**
 * "Timers" panel: a grid of countdown timers. Custom durations persist in
 * `settings.timers`; buttons reflow and scale with the panel size.
 */
export default function TimerPanel({ settings, onSettingsChange }: PanelComponentProps) {
  const timers = readTimers(settings)

  const addTimer = (seconds: number) => onSettingsChange({ timers: [...timers, seconds] })
  const removeTimer = (index: number) =>
    onSettingsChange({ timers: timers.filter((_, i) => i !== index) })

  return (
    <div className="flex h-full flex-col gap-2">
      <TimerAdder onAdd={addTimer} />
      <div
        className="grid flex-1 gap-2"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
          gridAutoRows: 'minmax(0, 1fr)',
          containerType: 'size',
        }}
      >
        {timers.map((t, i) => (
          <TimerButton key={`${t}-${i}`} time={t} onRemove={() => removeTimer(i)} />
        ))}
      </div>
    </div>
  )
}
