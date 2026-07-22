import { cn } from '@/lib/utils'

/**
 * Minimal controlled switch (no Radix). Supports the `size` and
 * `checked`/`onCheckedChange` API the airport row uses.
 */
export function Switch({
  checked,
  onCheckedChange,
  size = 'md',
  className,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  const dims = size === 'sm' ? { track: 'h-4 w-7', knob: 'h-3 w-3', on: 'translate-x-3' } : { track: 'h-5 w-9', knob: 'h-4 w-4', on: 'translate-x-4' }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors',
        dims.track,
        checked ? 'bg-primary' : 'bg-gray',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white transition-transform',
          dims.knob,
          checked ? dims.on : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
