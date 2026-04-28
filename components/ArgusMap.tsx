'use client'
import { useRef, useCallback, useEffect, useState } from 'react'
import Map, { Marker, Popup, NavigationControl, Source, Layer, type MapRef, type MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapStore } from '@/stores/mapStore'
import { IntelEvent } from '@/types'
import { SEVERITY_COLORS, CHOKEPOINTS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import LayerControls from './LayerControls'
import PlotsLayer from './PlotsLayer'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

type MapPopup =
  | { kind: 'cable'; name: string; lng: number; lat: number }
  | { kind: 'landing'; cables: string[]; cable_count: number; lng: number; lat: number }

export default function ArgusMap() {
  const mapRef = useRef<MapRef>(null)
  const { viewport, setViewport, events, layers, setSelectedCountry, setSelectedEvent, selectedEvent, setFlyToCallback } = useMapStore()
  const [hoveredEvent, setHoveredEvent] = useState<IntelEvent | null>(null)
  const [cablesGeoJSON, setCablesGeoJSON] = useState<object | null>(null)
  const [landingPointsGeoJSON, setLandingPointsGeoJSON] = useState<object | null>(null)
  const [mapPopup, setMapPopup] = useState<MapPopup | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/cables')
      .then(r => r.json())
      .then(setCablesGeoJSON)
      .catch(() => {
        fetch('/data/cables.json').then(r => r.json()).then(setCablesGeoJSON).catch(() => {})
      })
  }, [])

  useEffect(() => {
    if (!layers.landingPoints || landingPointsGeoJSON) return
    fetch('/data/landing-points.json')
      .then(r => r.json())
      .then(setLandingPointsGeoJSON)
      .catch(() => {})
  }, [layers.landingPoints, landingPointsGeoJSON])

  useEffect(() => {
    setFlyToCallback((lat, lon, zoom) => {
      mapRef.current?.flyTo({ center: [lon, lat], zoom: zoom || 5, duration: 1500 })
    })
  }, [setFlyToCallback])

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (!TOKEN) return

    // Check if click hit a cable or landing point layer first
    const features = e.features
    if (features && features.length > 0) {
      const feature = features[0]
      const { lng, lat } = e.lngLat
      const layerId = feature.layer?.id
      const props = (feature.properties ?? {}) as Record<string, unknown>

      if (layerId === 'landing-points-layer') {
        const cables = JSON.parse(String(props.cables || '[]')) as string[]
        setMapPopup({ kind: 'landing', cables, cable_count: Number(props.cable_count || 0), lng, lat })
        return
      }

      if (layerId === 'submarine-cables-layer') {
        setMapPopup({ kind: 'cable', name: String(props.name || 'Submarine Cable'), lng, lat })
        return
      }
    }

    // No layer hit — reverse geocode for country
    setMapPopup(null)
    const { lng, lat } = e.lngLat
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=country&access_token=${TOKEN}`)
        const data = await res.json()
        const feature = data.features?.[0]
        if (feature) {
          const name = feature.text || feature.place_name
          const code = (feature.properties?.short_code || '').toUpperCase()
          useMapStore.getState().setSelectedCountry(name, code)
        }
      } catch {}
    }, 280)
  }, [])

  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    const features = e.features
    const canvas = mapRef.current?.getCanvas()
    if (canvas) canvas.style.cursor = features && features.length > 0 ? 'pointer' : ''
  }, [])

  const filteredEvents = events.filter(e => {
    if (!layers.events) return false
    if (!layers.disasters && (e.category === 'disaster' || e.category === 'earthquake')) return false
    return true
  })

  const interactiveLayerIds: string[] = []
  if (layers.cables && cablesGeoJSON) interactiveLayerIds.push('submarine-cables-layer')
  if (layers.landingPoints && landingPointsGeoJSON) interactiveLayerIds.push('landing-points-layer')

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1d4ed8', overflow: 'hidden' }}>
      {!TOKEN && (
        <div style={{ position: 'absolute', inset: 0, background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 48, height: 48, background: '#E2E8F0', borderRadius: 8, marginBottom: 16 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Map Requires Mapbox Token</div>
          <div style={{ color: '#475569', maxWidth: 400, textAlign: 'center', lineHeight: 1.5 }}>
            Add your Mapbox public token to <code style={{ background: '#F1F3F5', padding: '2px 6px', borderRadius: 4 }}>.env.local</code> as <code style={{ background: '#F1F3F5', padding: '2px 6px', borderRadius: 4 }}>NEXT_PUBLIC_MAPBOX_TOKEN</code>
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#94A3B8' }}>All other platform features are fully functional</div>
        </div>
      )}
      {TOKEN && (
        <Map
          ref={mapRef}
          mapboxAccessToken={TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v11"
          projection="globe"
          latitude={viewport.latitude}
          longitude={viewport.longitude}
          zoom={viewport.zoom}
          pitch={viewport.pitch}
          bearing={viewport.bearing}
          onMove={(evt: { viewState: { latitude: number; longitude: number; zoom: number; pitch: number; bearing: number } }) => setViewport(evt.viewState)}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          interactiveLayerIds={interactiveLayerIds}
          style={{ width: '100%', height: '100%' }}
          fog={{
            color: 'white',
            'high-color': '#acc0c0',
            'horizon-blend': 0.02,
            'space-color': '#1d4ed8',
            'star-intensity': 0.3,
          } as Parameters<typeof Map>[0]['fog']}
        >
          <NavigationControl position="bottom-right" />

          {layers.chokepoints && CHOKEPOINTS.map(cp => (
            <Marker key={cp.name} latitude={cp.lat} longitude={cp.lon}>
              <div
                style={{ width: 12, height: 12, borderRadius: '50%', background: '#1D4ED8', border: '2px solid white', cursor: 'pointer', boxShadow: '0 0 0 3px rgba(29,78,216,0.3)' }}
                title={`${cp.name}: ${cp.description}`}
              />
            </Marker>
          ))}

          {layers.cables && cablesGeoJSON && (
            <Source id="submarine-cables" type="geojson" data={cablesGeoJSON as GeoJSON.FeatureCollection}>
              <Layer
                id="submarine-cables-layer"
                type="line"
                paint={{
                  'line-color': ['coalesce', ['get', 'color'], '#6366f1'],
                  'line-width': 1,
                  'line-opacity': 0.5,
                }}
              />
            </Source>
          )}

          {layers.landingPoints && landingPointsGeoJSON && (
            <Source id="landing-points" type="geojson" data={landingPointsGeoJSON as GeoJSON.FeatureCollection}>
              <Layer
                id="landing-points-layer"
                type="circle"
                paint={{
                  'circle-radius': [
                    'interpolate', ['linear'], ['get', 'cable_count'],
                    1, 3,
                    3, 4.5,
                    6, 6,
                    10, 8,
                  ],
                  'circle-color': '#1e293b',
                  'circle-stroke-width': 1.5,
                  'circle-stroke-color': '#ffffff',
                  'circle-opacity': 0.85,
                }}
              />
            </Source>
          )}

          {/* Cable / landing point popup */}
          {mapPopup && (
            <Popup
              latitude={mapPopup.lat}
              longitude={mapPopup.lng}
              closeButton
              closeOnClick={false}
              onClose={() => setMapPopup(null)}
              anchor="bottom"
              offset={[0, -8] as [number, number]}
            >
              {mapPopup.kind === 'cable' && (
                <div style={{ padding: '8px 10px', minWidth: 180 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Submarine Cable</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>{mapPopup.name}</div>
                </div>
              )}
              {mapPopup.kind === 'landing' && (
                <div style={{ padding: '8px 10px', minWidth: 200, maxWidth: 260 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#0891B2', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    Landing Station · {mapPopup.cable_count} cable{mapPopup.cable_count !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {mapPopup.cables.map((c, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#334155', lineHeight: 1.4 }}>{c}</div>
                    ))}
                    {mapPopup.cable_count > mapPopup.cables.length && (
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>+{mapPopup.cable_count - mapPopup.cables.length} more</div>
                    )}
                  </div>
                </div>
              )}
            </Popup>
          )}

          {filteredEvents.slice(0, 200).map(event => (
            <Marker
              key={event.id}
              latitude={event.lat}
              longitude={event.lon}
              onClick={(e: { originalEvent: Event }) => { e.originalEvent.stopPropagation(); setSelectedEvent(event); useMapStore.getState().flyTo(event.lat, event.lon, 5) }}
            >
              <div
                style={{
                  width: event.severity === 'critical' ? 14 : event.severity === 'high' ? 11 : 8,
                  height: event.severity === 'critical' ? 14 : event.severity === 'high' ? 11 : 8,
                  borderRadius: '50%',
                  background: SEVERITY_COLORS[event.severity],
                  border: '1.5px solid white',
                  cursor: 'pointer',
                  opacity: 0.85,
                  boxShadow: event.severity === 'critical' ? `0 0 0 3px ${SEVERITY_COLORS.critical}40` : undefined,
                }}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
              />
            </Marker>
          ))}

          {(selectedEvent || hoveredEvent) && (() => {
            const ev = selectedEvent || hoveredEvent!
            return (
              <Popup
                latitude={ev.lat}
                longitude={ev.lon}
                closeButton={!!selectedEvent}
                closeOnClick={false}
                onClose={() => setSelectedEvent(null)}
                anchor="bottom"
                offset={[0, -10] as [number, number]}
              >
                <div style={{ minWidth: 220, maxWidth: 280, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: SEVERITY_COLORS[ev.severity], textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {ev.severity}
                    </span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CBD5E1', display: 'inline-block' }} />
                    <span style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ev.source}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', lineHeight: 1.4, marginBottom: 5 }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, marginBottom: 9 }}>{ev.summary}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>
                      {ev.country} · {formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}
                    </span>
                    {ev.fatalities && (
                      <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: '#DC2626' }}>{ev.fatalities} KIA</span>
                    )}
                  </div>
                </div>
              </Popup>
            )
          })()}

          <PlotsLayer />
        </Map>
      )}
      <LayerControls />
    </div>
  )
}
