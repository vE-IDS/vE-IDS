import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import PanelContainer from '@/components/panels/PanelContainer'
import PanelToolbar from '@/components/chrome/PanelToolbar'
import { useDashboardStore } from '@/stores/dashboard'

export const Route = createFileRoute('/ids/')({
  component: DashboardPage,
})

function DashboardPage() {
  const config = useDashboardStore((s) => s.config)
  const load = useDashboardStore((s) => s.load)
  const mergeLayout = useDashboardStore((s) => s.mergeLayout)
  const removePanel = useDashboardStore((s) => s.removePanel)
  const updatePanelSettings = useDashboardStore((s) => s.updatePanelSettings)

  useEffect(() => {
    void load()
  }, [load])

  if (!config) return <div className="p-8 text-muted-foreground">Loading dashboard…</div>

  return (
    <div className="flex h-full flex-col">
      <PanelToolbar />
      <div className="min-h-0 flex-1 overflow-auto">
        <PanelContainer
          config={config}
          onLayoutsChange={mergeLayout}
          onRemovePanel={removePanel}
          onSettingsChange={updatePanelSettings}
        />
      </div>
    </div>
  )
}
