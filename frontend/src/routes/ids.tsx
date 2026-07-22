import { useEffect } from 'react'
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'

import { useAuth } from '@/hooks/useAuth'
import { useLiveStore } from '@/stores/liveData'
import Navbar from '@/components/chrome/Navbar'
import Footer from '@/components/chrome/Footer'

export const Route = createFileRoute('/ids')({
  component: IdsLayout,
})

/**
 * IDS layout: guards auth, opens the single live-data WebSocket for the whole
 * IDS, and frames every /ids/* page in the dark navbar + footer chrome.
 */
function IdsLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const connect = useLiveStore((s) => s.connect)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/' })
  }, [isLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated) return
    return connect()
  }, [isAuthenticated, connect])

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen flex-col text-foreground">
      <Navbar />
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
