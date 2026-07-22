import type { ComponentType } from 'react'
import type { PanelType } from '@/types/dashboard.type'
import AirportPanel from '@/components/ids/airport/AirportPanel'

/**
 * The single source of truth for dashboard panel kinds. Add a panel by extending
 * PanelType, adding it to PANEL_TYPES in lib/dashboard.ts, and adding one entry
 * here. Panel components render CONTENT ONLY; the shared Panel chrome adds the
 * title bar / drag handle / remove button.
 *
 * NOTE (vertical slice): only the `airport` panel is implemented. `timer` and
 * `notes` are deferred (see docs/NOT-DONE.md) and intentionally absent here — an
 * unknown/absent type renders a placeholder rather than crashing.
 */

export interface PanelComponentProps {
  id: string
  settings?: Record<string, unknown>
  onSettingsChange: (patch: Record<string, unknown>) => void
}

export interface PanelDefinition {
  title: string
  component: ComponentType<PanelComponentProps>
  defaultSize: { w: number; h: number; minW?: number; minH?: number }
}

export const PANEL_REGISTRY: Partial<Record<PanelType, PanelDefinition>> = {
  airport: {
    title: 'Airports',
    component: AirportPanel,
    defaultSize: { w: 5, h: 6, minW: 3, minH: 3 },
  },
}

export function getPanelDefinition(type: PanelType): PanelDefinition | undefined {
  return PANEL_REGISTRY[type]
}
