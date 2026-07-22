import { create } from 'zustand'

import { ApiError, apiFetch } from '@/lib/api'
import {
  addPanel as addPanelFn,
  getDefaultDashboard,
  mergeLayoutChange,
  removePanel as removePanelFn,
  updatePanelSettings as updateSettingsFn,
} from '@/lib/dashboard'
import { getPanelDefinition } from '@/components/panels/registry'
import type { Breakpoint, DashboardConfig, GridItem, PanelType } from '@/types/dashboard.type'

/**
 * Long-lived dashboard store (Zustand). Holds the live DashboardConfig and
 * save-status. Every mutation debounces a PUT /api/dashboards/default so dragging
 * doesn't spam the API. Hydrated once via load() (404 → bundled default).
 */
interface DashboardState {
  config: DashboardConfig | null
  loaded: boolean
  saving: boolean
  lastSaved: number | null
  error: string | null
  load: () => Promise<void>
  addPanel: (type: PanelType) => void
  removePanel: (id: string) => void
  updatePanelSettings: (id: string, patch: Record<string, unknown>) => void
  mergeLayout: (breakpoint: Breakpoint, layout: GridItem[]) => void
  resetToDefault: () => void
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

export const useDashboardStore = create<DashboardState>((set, get) => {
  const scheduleSave = (config: DashboardConfig) => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      set({ saving: true, error: null })
      try {
        await apiFetch('/dashboards/default', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        })
        set({ saving: false, lastSaved: Date.now() })
      } catch (e) {
        set({ saving: false, error: e instanceof Error ? e.message : 'save failed' })
      }
    }, 800)
  }

  const apply = (next: DashboardConfig) => {
    set({ config: next })
    scheduleSave(next)
  }

  return {
    config: null,
    loaded: false,
    saving: false,
    lastSaved: null,
    error: null,

    load: async () => {
      if (get().loaded) return
      try {
        const cfg = await apiFetch<DashboardConfig>('/dashboards/default')
        set({ config: cfg, loaded: true })
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          set({ config: getDefaultDashboard(), loaded: true })
        } else {
          set({
            config: getDefaultDashboard(),
            loaded: true,
            error: e instanceof Error ? e.message : 'load failed',
          })
        }
      }
    },

    addPanel: (type) => {
      const c = get().config
      const def = getPanelDefinition(type)
      if (!c || !def) return
      apply(addPanelFn(c, type, def.defaultSize))
    },
    removePanel: (id) => {
      const c = get().config
      if (c) apply(removePanelFn(c, id))
    },
    updatePanelSettings: (id, patch) => {
      const c = get().config
      if (c) apply(updateSettingsFn(c, id, patch))
    },
    mergeLayout: (breakpoint, layout) => {
      const c = get().config
      if (c) apply(mergeLayoutChange(c, breakpoint, layout))
    },
    resetToDefault: () => apply(getDefaultDashboard()),
  }
})
