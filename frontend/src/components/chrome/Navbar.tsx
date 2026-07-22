import { Link } from '@tanstack/react-router'
import { Home, Map as MapIcon, Plane, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { PERM_SYSTEM_ACCESS } from '@/types/facility.type'
import Clock from './Clock'
import SessionStatus from './SessionStatus'
import StatusPopover from './StatusPopover'

/**
 * IDS top bar (dark ops-display chrome): status popover + brand on the left, the
 * Zulu/local clock in the center, and quick-nav icons + the signed-in user on the
 * right.
 */
export default function Navbar() {
  const { user, logout } = useAuth()
  const canAdmin = user?.permissions?.includes(PERM_SYSTEM_ACCESS) ?? false

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-gray bg-mid-gray px-4">
      <div className="flex items-center gap-4">
        <StatusPopover />
        <Link to="/ids" className="flex flex-col leading-tight">
          <span className="text-lg font-bold">vE-IDS</span>
          <span className="text-[11px] text-muted-foreground">ZJX ARTCC</span>
        </Link>
      </div>

      <Clock />

      <div className="flex items-center gap-2">
        <NavIcon to="/ids" label="Dashboard" className="bg-primary hover:bg-primary/80">
          <Home size={18} />
        </NavIcon>
        <NavIcon to="/ids/charts" label="Charts" className="bg-sky-700 hover:bg-sky-600">
          <MapIcon size={18} />
        </NavIcon>
        <NavIcon to="/ids/map" label="Map" className="bg-emerald-700 hover:bg-emerald-600">
          <Plane size={18} />
        </NavIcon>
        {canAdmin && (
          <NavIcon to="/ids/admin" label="Admin" className="bg-amber-600 hover:bg-amber-500">
            <Shield size={18} />
          </NavIcon>
        )}

        <SessionStatus />

        <div className="ml-2 flex flex-col items-end leading-tight">
          <span className="text-sm">
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </span>
          <span className="text-[11px] text-muted-foreground">{user?.cid}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  )
}

function NavIcon({
  to,
  label,
  className,
  children,
}: {
  to: string
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Button asChild size="icon" className={className} title={label} aria-label={label}>
      <Link to={to}>{children}</Link>
    </Button>
  )
}
