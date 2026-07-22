import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, login as startLogin, logout as apiLogout  } from '@/lib/api'
import type {CurrentUser} from '@/lib/api';

/**
 * Authentication state, backed by GET /api/auth/me. `login` bounces to the
 * VATSIM OAuth flow; `logout` revokes the session and returns to the landing.
 */
export function useAuth() {
  const queryClient = useQueryClient()

  const query = useQuery<CurrentUser | null>({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 60_000,
    retry: false,
  })

  const logout = async () => {
    await apiLogout()
    queryClient.setQueryData(['me'], null)
    window.location.href = '/'
  }

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    login: startLogin,
    logout,
  }
}
