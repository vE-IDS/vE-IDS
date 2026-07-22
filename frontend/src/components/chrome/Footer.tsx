import { Link } from '@tanstack/react-router'

import { useAuth } from '@/hooks/useAuth'
import { PERM_SYSTEM_ACCESS } from '@/types/facility.type'

/**
 * IDS bottom bar — the dense two-row button rail from the old IDS. The active
 * buttons navigate between the dashboard and the full-screen pages; the rest are
 * disabled placeholders (reserved slots, same as the old app), kept so the bar
 * reads as the familiar ops rail. Horizontally scrollable.
 */

type FooterItem = { label: string; to?: string; exact?: boolean }

// The Admin slot is only enabled for users with facility access; for everyone
// else it stays a reserved placeholder so the rail keeps its fixed width.
function rowOne(canAdmin: boolean): Array<FooterItem> {
  return [
    { label: 'Dashboard', to: '/ids', exact: true },
    { label: 'Chart Viewer', to: '/ids/charts' },
    { label: 'Map', to: '/ids/map' },
    canAdmin ? { label: 'Admin', to: '/ids/admin' } : { label: '' },
    ...Array.from({ length: 8 }, () => ({ label: '' })),
  ]
}

const ROW_TWO: Array<FooterItem> = [
  ...Array.from({ length: 11 }, () => ({ label: '' })),
  { label: 'Info Test', to: '/ids/info/KMCO' },
]

function FooterButton({ item }: { item: FooterItem }) {
  const base =
    'flex h-10 w-40 shrink-0 items-center justify-center border-r border-b border-mid-gray text-xs font-bold transition'
  if (!item.to) {
    return <div className={`${base} bg-light-gray text-muted-foreground/60`}>DISABLED</div>
  }
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.exact }}
      // Enabled buttons sit at 80% blue; the active page fills to full blue — a
      // subtle highlight (no bright ring).
      className={`${base} bg-primary/80 text-primary-foreground hover:bg-primary`}
      activeProps={{ className: 'bg-primary' }}
    >
      {item.label}
    </Link>
  )
}

export default function Footer() {
  const { user } = useAuth()
  const canAdmin = user?.permissions?.includes(PERM_SYSTEM_ACCESS) ?? false

  return (
    <footer className="no-scrollbar h-20 shrink-0 overflow-x-auto border-t-2 border-dark-gray bg-dark-gray">
      <div className="flex w-max flex-col">
        <div className="flex">
          {rowOne(canAdmin).map((item, i) => (
            <FooterButton key={`r1-${i}`} item={item} />
          ))}
        </div>
        <div className="flex">
          {ROW_TWO.map((item, i) => (
            <FooterButton key={`r2-${i}`} item={item} />
          ))}
        </div>
      </div>
    </footer>
  )
}
