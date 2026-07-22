import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { ApiError, getAdminFacilities } from '@/lib/api'
import { STAFF_POSITIONS, roleLabel, type AdminFacility } from '@/types/facility.type'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/ids/admin')({
  component: AdminPage,
})

// Rendered inside the /ids layout, which guards auth and provides the
// navbar/footer chrome. The admin API additionally gates on the system.access
// permission (403 → "not authorized").
function AdminPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'facilities'],
    queryFn: getAdminFacilities,
    retry: false,
  })

  const forbidden = error instanceof ApiError && error.status === 403

  return (
    <div className="h-full overflow-auto p-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold">Facility Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Facilities you administer, synced from VATUSA.
        </p>
      </header>

      {isLoading ? (
        <FacilityGrid>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </FacilityGrid>
      ) : forbidden ? (
        <EmptyState
          title="Not authorized"
          body="Your VATSIM account is not a facility staff member (ATM, DATM, TA, FE, or FACCBT). Contact facility staff if you believe this is an error."
        />
      ) : error ? (
        <EmptyState title="Couldn’t load facilities" body="Please try again shortly." />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No facilities"
          body="You don’t have an administrative role at any facility yet."
        />
      ) : (
        <FacilityGrid>
          {data.map((f) => (
            <FacilityCard key={f.id} facility={f} />
          ))}
        </FacilityGrid>
      )}
    </div>
  )
}

function FacilityGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
  )
}

function FacilityCard({ facility }: { facility: AdminFacility }) {
  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-foreground">{facility.name}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-sm bg-mid-gray px-1.5 py-0.5 font-mono tabular-nums">
                {facility.id}
              </span>
              <span className="font-mono tabular-nums">VATUSA{facility.region}</span>
              {!facility.active && <span className="text-destructive">inactive</span>}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {facility.roles.map((r) => (
              <span
                key={r}
                className="rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase"
              >
                {roleLabel(r)}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4">
        <Separator className="mb-3" />
        <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          Staff
        </div>
        <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2">
          {STAFF_POSITIONS.map(({ key, label }) => (
            <StaffCell key={key} label={label} cid={facility.staff?.[key]} />
          ))}
        </div>
        {facility.url && (
          <a
            href={facility.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-[11px] text-primary hover:underline"
          >
            {facility.url.replace(/^https?:\/\//, '')}
          </a>
        )}
      </CardContent>
    </Card>
  )
}

function StaffCell({ label, cid }: { label: string; cid?: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="font-mono text-xs tabular-nums">{cid ? cid : '—'}</span>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-md rounded-lg border border-gray bg-mid-gray p-6">
      <div className="text-sm font-bold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  )
}
