import { createFileRoute } from '@tanstack/react-router'
import LeafletMap from '@/components/ids/map/LeafletMap'

export const Route = createFileRoute('/ids/map')({
  component: MapPage,
})

function MapPage() {
  return (
    <div className="h-full w-full">
      <LeafletMap />
    </div>
  )
}
