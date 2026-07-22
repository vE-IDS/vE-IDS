/**
 * Serializable contract for the modular IDS dashboard. This exact object is what
 * the Go API stores in dashboard_layouts.config (JSONB) and what the client
 * hydrates from, so it must stay JSON-serializable and versioned.
 */

/** The registered panel kinds. Add a new panel by extending this + the registry. */
export type PanelType = 'timer' | 'notes' | 'airport'

/** Responsive breakpoint keys used by the grid. */
export type Breakpoint = 'lg' | 'md' | 'sm'

/** One placed panel instance on the dashboard. */
export interface DashboardPanel {
  /** Unique instance id, e.g. `airport-1`. Matches the grid item `i`. */
  id: string
  /** Which registered panel to render. */
  type: PanelType
  /** Optional panel-specific persisted settings. */
  settings?: Record<string, unknown>
}

/** A single grid cell placement (grid units, not pixels). */
export interface GridItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

/** Per-breakpoint layouts. `lg` is required; smaller breakpoints are optional. */
export interface ResponsiveLayout {
  lg: GridItem[]
  md?: GridItem[]
  sm?: GridItem[]
}

/** The full, serializable dashboard. */
export interface DashboardConfig {
  /** Schema version, bumped on breaking changes. */
  version: 1
  /** Panel instances rendered on the grid. */
  panels: DashboardPanel[]
  /** Grid placement of each panel, per breakpoint. */
  layouts: ResponsiveLayout
}
