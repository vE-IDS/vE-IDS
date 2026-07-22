import type {
  Breakpoint,
  DashboardConfig,
  DashboardPanel,
  GridItem,
  PanelType,
} from '@/types/dashboard.type'

/**
 * Pure, dependency-light helpers for the dashboard config contract (JSON-in /
 * JSON-out). Shared between the grid and its persistence.
 */

/** Registered panel types. Keep in sync with PanelType and the registry. */
export const PANEL_TYPES = ['timer', 'notes', 'airport'] as const

/** Grid column counts per breakpoint. */
export const GRID_COLS: Record<Breakpoint, number> = { lg: 12, md: 8, sm: 4 }

/** Breakpoint min-widths (px). */
export const GRID_BREAKPOINTS: Record<Breakpoint, number> = { lg: 1200, md: 768, sm: 0 }

/** Height of a single grid row in pixels. */
export const GRID_ROW_HEIGHT = 64

/**
 * The seed dashboard. Includes an Airports panel so the vertical slice shows
 * live ATIS out of the box.
 */
export function getDefaultDashboard(): DashboardConfig {
  return {
    version: 1,
    panels: [{ id: 'airport-1', type: 'airport' }],
    layouts: {
      lg: [{ i: 'airport-1', x: 0, y: 0, w: 5, h: 6, minW: 3, minH: 3 }],
    },
  }
}

/** Convenience constant; prefer getDefaultDashboard when you need a mutable copy. */
export const DEFAULT_DASHBOARD: DashboardConfig = getDefaultDashboard()

/**
 * Fold a react-grid-layout layout for one breakpoint back into a config. Only
 * the given breakpoint's layout is replaced.
 */
export function mergeLayoutChange(
  config: DashboardConfig,
  breakpoint: Breakpoint,
  layout: ReadonlyArray<GridItem>,
): DashboardConfig {
  const cleaned: GridItem[] = layout.map((item) => ({
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    ...(item.minW !== undefined ? { minW: item.minW } : {}),
    ...(item.minH !== undefined ? { minH: item.minH } : {}),
  }))

  return {
    ...config,
    layouts: { ...config.layouts, [breakpoint]: cleaned },
  }
}

/** Add a new panel of the given type at the bottom of the `lg` grid. */
export function addPanel(
  config: DashboardConfig,
  type: PanelType,
  size: { w: number; h: number; minW?: number; minH?: number },
): DashboardConfig {
  const id = generatePanelId(config, type)
  const nextY = bottomOf(config.layouts.lg)

  const panel: DashboardPanel = { id, type }
  const item: GridItem = { i: id, x: 0, y: nextY, w: size.w, h: size.h, minW: size.minW, minH: size.minH }

  return {
    ...config,
    panels: [...config.panels, panel],
    layouts: { ...config.layouts, lg: [...config.layouts.lg, item] },
  }
}

/** Remove a panel (and its grid items across every breakpoint) by instance id. */
export function removePanel(config: DashboardConfig, id: string): DashboardConfig {
  const filterItems = (items?: GridItem[]) => items?.filter((it) => it.i !== id)
  return {
    ...config,
    panels: config.panels.filter((p) => p.id !== id),
    layouts: {
      lg: filterItems(config.layouts.lg) ?? [],
      ...(config.layouts.md ? { md: filterItems(config.layouts.md) } : {}),
      ...(config.layouts.sm ? { sm: filterItems(config.layouts.sm) } : {}),
    },
  }
}

/** Shallow-merge a settings patch into a single panel, returning a new config. */
export function updatePanelSettings(
  config: DashboardConfig,
  id: string,
  patch: Record<string, unknown>,
): DashboardConfig {
  return {
    ...config,
    panels: config.panels.map((p) =>
      p.id === id ? { ...p, settings: { ...p.settings, ...patch } } : p,
    ),
  }
}

function bottomOf(items: GridItem[]): number {
  return items.reduce((max, it) => Math.max(max, it.y + it.h), 0)
}

function generatePanelId(config: DashboardConfig, type: PanelType): string {
  const existing = new Set(config.panels.map((p) => p.id))
  let n = 1
  while (existing.has(`${type}-${n}`)) n++
  return `${type}-${n}`
}
