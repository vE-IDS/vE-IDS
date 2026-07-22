import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/hooks/useAuth'
import { LiveDataProvider, useLiveStatus } from '@/hooks/useLiveData'
import PanelContainer from '@/components/panels/PanelContainer'
import { ApiError, apiFetch } from '@/lib/api'
import {
  getDefaultDashboard,
  mergeLayoutChange,
  removePanel as removePanelFn,
  updatePanelSettings as updateSettingsFn,
} from '@/lib/dashboard'
import type { Breakpoint, DashboardConfig, GridItem } from '@/types/dashboard.type'

export const Route = createFileRoute('/ids')({
  component: IdsPage,
})

function IdsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/' })
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!isAuthenticated) return null

  return (
    <LiveDataProvider>
      <Dashboard />
    </LiveDataProvider>
  )
}

function Dashboard() {
  const { data: initial } = useQuery({
    queryKey: ['dashboard', 'default'],
    queryFn: async (): Promise<DashboardConfig> => {
      try {
        return await apiFetch<DashboardConfig>('/dashboards/default')
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return getDefaultDashboard()
        throw err
      }
    },
  })

  const [config, setConfig] = useState<DashboardConfig | null>(null)
  useEffect(() => {
    if (initial && !config) setConfig(initial)
  }, [initial, config])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const update = (next: DashboardConfig) => {
    setConfig(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      apiFetch('/dashboards/default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {})
    }, 800)
  }

  if (!config) return <div className="p-8 text-muted-foreground">Loading dashboard…</div>

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="min-h-0 flex-1 overflow-auto">
        <PanelContainer
          config={config}
          onLayoutsChange={(bp: Breakpoint, layout: GridItem[]) => update(mergeLayoutChange(config, bp, layout))}
          onRemovePanel={(id) => update(removePanelFn(config, id))}
          onSettingsChange={(id, patch) => update(updateSettingsFn(config, id, patch))}
        />
      </div>
    </div>
  )
}

function Header() {
  const { user, logout } = useAuth()
  const status = useLiveStatus()
  return (
    <header className="flex items-center justify-between border-b border-gray bg-mid-gray px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="font-bold">vE-IDS</span>
        <span className={status === 'open' ? 'text-xs text-vfr' : 'text-xs text-muted-foreground'}>
          ● live {status}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {user && <span className="text-muted-foreground">CID {user.cid}</span>}
        <button type="button" onClick={logout} className="rounded bg-secondary px-2 py-1 hover:bg-gray">
          Sign out
        </button>
      </div>
    </header>
  )
}
