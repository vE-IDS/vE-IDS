import { useMemo } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'

import Panel from './Panel'
import { getPanelDefinition } from './registry'
import { GRID_BREAKPOINTS, GRID_COLS, GRID_ROW_HEIGHT } from '@/lib/dashboard'
import type { Breakpoint, DashboardConfig, GridItem } from '@/types/dashboard.type'

const ResponsiveGridLayout = WidthProvider(Responsive)

/**
 * The draggable/resizable dashboard grid. Renders each placed panel via the
 * registry inside the shared Panel chrome and reports layout/settings changes
 * up to the owner (the /ids route holds the config state). Dragging is gated to
 * each panel header (`.panel-drag-handle`); resize uses the SE handle.
 */
export default function PanelContainer({
  config,
  onLayoutsChange,
  onRemovePanel,
  onSettingsChange,
}: {
  config: DashboardConfig
  onLayoutsChange: (breakpoint: Breakpoint, layout: GridItem[]) => void
  onRemovePanel: (id: string) => void
  onSettingsChange: (id: string, patch: Record<string, unknown>) => void
}) {
  // react-grid-layout wants a Layouts map keyed by breakpoint.
  const layouts = useMemo<Layouts>(() => config.layouts as unknown as Layouts, [config.layouts])

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={GRID_BREAKPOINTS}
      cols={GRID_COLS}
      rowHeight={GRID_ROW_HEIGHT}
      margin={[8, 8]}
      containerPadding={[4, 4]}
      draggableHandle=".panel-drag-handle"
      draggableCancel=".panel-no-drag"
      resizeHandles={['se']}
      onLayoutChange={(current: Layout[], all: Layouts) => {
        // Persist the current (lg) view as the source of truth for the slice;
        // md/sm persistence is deferred. `all` is unused for now.
        void all
        onLayoutsChange('lg', current)
      }}
    >
      {config.panels.map((panel) => {
        const def = getPanelDefinition(panel.type)
        const Content = def?.component
        return (
          <div key={panel.id}>
            <Panel title={def?.title ?? panel.type} onRemove={() => onRemovePanel(panel.id)}>
              {Content ? (
                <Content
                  id={panel.id}
                  settings={panel.settings}
                  onSettingsChange={(patch) => onSettingsChange(panel.id, patch)}
                />
              ) : (
                <p className="text-muted-foreground">Unknown panel: {panel.type}</p>
              )}
            </Panel>
          </div>
        )
      })}
    </ResponsiveGridLayout>
  )
}
