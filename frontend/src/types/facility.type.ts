/**
 * Facility administration DTOs — wire-compatible with the Go API
 * (GET /api/admin/facilities and the `facilities` field of GET /api/auth/me).
 */

export interface AdminFacility {
  id: string
  name: string
  region: number
  url: string
  active: boolean
  /** The current user's role keys at this facility (e.g. "facility.atm"). */
  roles: string[]
  /** Facility staff CIDs by position, synced from VATUSA. */
  staff?: Record<string, number>
}

/** Human-readable labels for role keys. */
export const ROLE_LABELS: Record<string, string> = {
  'facility.atm': 'ATM',
  'facility.datm': 'DATM',
  'facility.ta': 'TA',
  'facility.fe': 'FE',
  'facility.faccbt': 'FACCBT',
  'system.admin': 'System Admin',
}

/** Display order + labels for the staff positions carried in `staff`. */
export const STAFF_POSITIONS: Array<{ key: string; label: string }> = [
  { key: 'atm', label: 'ATM' },
  { key: 'datm', label: 'DATM' },
  { key: 'ta', label: 'TA' },
  { key: 'fe', label: 'FE' },
  { key: 'ec', label: 'EC' },
  { key: 'wm', label: 'WM' },
]

/** Permission key that gates the admin area. */
export const PERM_SYSTEM_ACCESS = 'system.access'

export function roleLabel(key: string): string {
  return ROLE_LABELS[key] ?? key
}
