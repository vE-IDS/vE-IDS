import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { ApiError, apiFetch } from '@/lib/api'
import type { AirportData } from '@/types/chart.type'

export const Route = createFileRoute('/ids/info/$icao')({
  component: InfoPage,
})

function InfoPage() {
  const { icao } = Route.useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['airport', icao],
    queryFn: async (): Promise<AirportData | null> => {
      try {
        return await apiFetch<AirportData>(`/airports/${icao}`)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
  })

  return (
    <div className="h-full overflow-auto p-6">
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data ? (
        <p className="text-muted-foreground">No data for {icao.toUpperCase()}.</p>
      ) : (
        <div>
          <h1 className="text-2xl font-bold">
            {data.icaoIdent} — {data.airportName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {[data.city, data.fullState].filter(Boolean).join(', ')}
          </p>
          <div className="mt-4 grid max-w-md grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <Field label="ICAO" value={data.icaoIdent} />
            <Field label="FAA" value={data.faaIdent} />
            <Field label="City" value={data.city} />
            <Field label="State" value={data.state} />
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span>{value || '—'}</span>
    </>
  )
}
