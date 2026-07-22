import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { ApiError, apiFetch } from '@/lib/api'
import ChartViewer from '@/components/ids/charts/ChartViewer'
import type { ChartSet } from '@/types/chart.type'

export const Route = createFileRoute('/ids/charts')({
  validateSearch: (search: Record<string, unknown>): { airport?: string } => ({
    airport: typeof search.airport === 'string' ? search.airport.toUpperCase() : undefined,
  }),
  component: ChartsPage,
})

function ChartsPage() {
  const { airport } = Route.useSearch()
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['charts', airport],
    enabled: !!airport,
    queryFn: async (): Promise<ChartSet | null> => {
      try {
        return await apiFetch<ChartSet>(`/charts?airport=${airport}`)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
  })

  return (
    <ChartViewer
      icao={airport ?? ''}
      chartData={data ?? undefined}
      onSearch={(icao) => navigate({ to: '/ids/charts', search: { airport: icao } })}
    />
  )
}
