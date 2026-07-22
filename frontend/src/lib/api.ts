/**
 * Typed fetch wrapper for the Go API. Sends cookies (credentials: 'include') so
 * the httpOnly access JWT rides along automatically. On a 401 it transparently
 * attempts one token refresh and retries the original request.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let refreshInFlight: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      .then((r) => r.ok)
      .catch(() => false)
  }
  const ok = await refreshInFlight
  refreshInFlight = null
  return ok
}

function toURL(path: string): string {
  return path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  const res = await fetch(toURL(path), {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', ...(init.headers ?? {}) },
  })

  if (res.status === 401 && !retried) {
    if (await tryRefresh()) {
      return apiFetch<T>(path, init, true)
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ApiError(res.status, body || res.statusText)
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }
  return undefined as T
}

import type { AdminFacility } from '@/types/facility.type'

export interface CurrentUser {
  id: string
  cid: string
  firstName: string
  lastName: string
  email: string
  rating: number
  /** Effective permission keys (drive admin gating). Empty for most controllers. */
  permissions: string[]
  /** Facilities the user administers, with their roles. Empty for most controllers. */
  facilities: AdminFacility[]
}

/** Fetch the authenticated user, or null if not signed in. */
export async function getMe(): Promise<CurrentUser | null> {
  try {
    return await apiFetch<CurrentUser>('/auth/me')
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

/** Fetch the facilities the current user administers (gated by system.access). */
export async function getAdminFacilities(): Promise<AdminFacility[]> {
  return apiFetch<AdminFacility[]>('/admin/facilities')
}

/** Redirect the browser into the VATSIM OAuth login flow. */
export function login(): void {
  window.location.href = '/api/auth/vatsim/login'
}

/** Revoke the session server-side and clear cookies. */
export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
}
