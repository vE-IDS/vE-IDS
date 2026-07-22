import { useMyPosition } from '@/stores/liveData'

/**
 * Navbar session indicator. When the signed-in user is actively controlling
 * (matched from the vNAS controller feed by CID), it shows "Active" with their
 * readable position — e.g. "Active · O'Hare Tower". When their session is
 * inactive (offline, observing, or not active) it renders nothing.
 *
 * Follows the card vernacular: the position label (identity) is in Inter, the
 * frequency (coded data) in monospace, with green as the single "live" accent.
 */
export default function SessionStatus() {
  const pos = useMyPosition()
  if (!pos) return null

  // The feed's radioName is already the readable label (e.g. "O'Hare Tower");
  // fall back to facility + position only if it's ever missing.
  const label =
    pos.radioName || [pos.facilityName, pos.positionName].filter(Boolean).join(' ')

  return (
    <div className="flex items-center gap-2 rounded-md border border-green-800/60 bg-green-950/40 px-2.5 py-1 text-xs">
      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
      <span className="font-semibold text-green-400">Active</span>
      <span className="text-muted-foreground">·</span>
      <span className="font-medium">{label}</span>
      {pos.frequency && (
        <span className="font-mono tabular-nums text-muted-foreground">{pos.frequency}</span>
      )}
    </div>
  )
}
