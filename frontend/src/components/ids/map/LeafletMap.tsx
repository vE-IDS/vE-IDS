import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { LayerGroup, LayersControl, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

import { useDatafeed } from '@/stores/liveData'
import type { PilotMarker } from '@/types/feed'

const { BaseLayer, Overlay } = LayersControl

/** Rough geographic center of the contiguous US, for the initial view. */
const INITIAL_CENTER: [number, number] = [39.5, -98.35]
const INITIAL_ZOOM = 4

/**
 * Heading-rotated aircraft marker. The SVG points north at 0°, so rotating by the
 * true heading orients it. A divIcon avoids shipping marker assets / the classic
 * Leaflet marker-icon 404.
 */
function pilotIcon(heading: number): L.DivIcon {
  return L.divIcon({
    className: 'pilot-marker',
    html:
      `<div style="transform: rotate(${heading}deg); transform-origin: center;">` +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="#e6e6e6" stroke="#0a0a0a" stroke-width="0.5">' +
      '<path d="M12 2l2 8 8 4v2l-8-3v5l3 2v1l-5-2-5 2v-1l3-2v-5l-8 3v-2l8-4z"/>' +
      '</svg></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function PilotPopup({ pilot }: { pilot: PilotMarker }) {
  return (
    <div className="text-xs text-black">
      <div className="font-semibold">{pilot.callsign}</div>
      {pilot.aircraft && <div>{pilot.aircraft}</div>}
      {(pilot.departure || pilot.arrival) && (
        <div>
          {pilot.departure || '????'} → {pilot.arrival || '????'}
        </div>
      )}
      <div>
        {Math.round(pilot.altitude)} ft · {Math.round(pilot.groundspeed)} kt
      </div>
    </div>
  )
}

/**
 * Dark Leaflet map for /ids/map. CARTO dark base + a togglable "Pilots" overlay of
 * live VATSIM traffic fed by the WebSocket datafeed projection (no fetch).
 * Controllers is a stubbed empty overlay marking the extension point.
 */
export default function LeafletMap() {
  const pilots = useDatafeed()?.pilots ?? []

  return (
    <MapContainer center={INITIAL_CENTER} zoom={INITIAL_ZOOM} className="h-full w-full bg-dark-gray" worldCopyJump>
      <LayersControl position="topright">
        <BaseLayer checked name="Dark">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />
        </BaseLayer>

        <Overlay checked name="Pilots">
          <LayerGroup>
            {pilots.map((p) => (
              <Marker key={p.callsign} position={[p.lat, p.lon]} icon={pilotIcon(p.heading)}>
                <Popup>
                  <PilotPopup pilot={p} />
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        </Overlay>

        <Overlay name="Controllers (coming soon)">
          <LayerGroup />
        </Overlay>
      </LayersControl>
    </MapContainer>
  )
}
