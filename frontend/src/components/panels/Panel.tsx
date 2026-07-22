import { X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Presentational chrome for a single dashboard panel: a draggable title bar and
 * a scrollable content area. The header carries `panel-drag-handle` (the
 * react-grid-layout drag handle); the remove button is `panel-no-drag` so
 * clicking it never starts a drag.
 */
export default function Panel({
  title,
  onRemove,
  children,
}: {
  title: string
  onRemove?: () => void
  children?: ReactNode
}) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden border border-gray bg-black">
      <div className="panel-drag-handle flex cursor-move items-center justify-between bg-gray px-2 py-1">
        <h3 className="text-sm font-semibold">{title.toUpperCase()}</h3>
        {onRemove && (
          <button
            type="button"
            aria-label={`Remove ${title} panel`}
            onClick={onRemove}
            className="panel-no-drag cursor-pointer rounded p-0.5 text-white/70 transition hover:bg-black/40 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-1">{children}</div>
    </div>
  )
}
