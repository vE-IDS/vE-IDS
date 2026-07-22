import { Plus, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PANEL_REGISTRY } from '@/components/panels/registry'
import { useDashboardStore } from '@/stores/dashboard'
import { formatTimeZulu } from '@/lib/date'
import type { PanelType } from '@/types/dashboard.type'

/**
 * Toolbar above the dashboard grid: add a panel, reset to the default layout, and
 * a live save-status indicator. All actions dispatch to the dashboard store,
 * which debounce-saves the resulting config.
 */
export default function PanelToolbar() {
  const addPanel = useDashboardStore((s) => s.addPanel)
  const resetToDefault = useDashboardStore((s) => s.resetToDefault)
  const saving = useDashboardStore((s) => s.saving)
  const lastSaved = useDashboardStore((s) => s.lastSaved)
  const error = useDashboardStore((s) => s.error)

  const entries = Object.entries(PANEL_REGISTRY) as Array<
    [PanelType, { title: string }]
  >

  return (
    <div className="flex items-center gap-2 border-b border-gray bg-mid-gray px-2 py-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="secondary" className="gap-1">
            <Plus size={14} /> Add panel
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-1">
          <div className="flex flex-col">
            {entries.map(([type, def]) => (
              <button
                key={type}
                type="button"
                onClick={() => addPanel(type)}
                className="rounded px-2 py-1.5 text-left text-sm transition hover:bg-accent"
              >
                {def.title}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button size="sm" variant="ghost" className="gap-1" onClick={resetToDefault}>
        <RotateCcw size={14} /> Reset
      </Button>

      <span className="ml-auto text-xs text-muted-foreground">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : saving ? (
          'Saving…'
        ) : lastSaved ? (
          `Saved ${formatTimeZulu(new Date(lastSaved))}`
        ) : (
          ''
        )}
      </span>
    </div>
  )
}
