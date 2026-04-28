'use client'
import { useRef, useCallback, useEffect, useState } from 'react'
import Map, { Marker, Popup, NavigationControl, Source, Layer, type MapRef, type MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapStore } from '@/stores/mapStore'
import { IntelEvent } from '@/types'
import { SEVERITY_COLORS, CHOKEPOINTS } from '@/lib/constants'
import { haversineDistance } from '@/lib/haversine'
import { formatDistanceToNow } from 'date-fns'
import LayerControls from './LayerControls'
import PlotsLayer from './PlotsLayer'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
const CABLE_THREAT_KM = 40 // events within this distance highlight a cable as at-risk

type CableInfo = {
  id: string; name: string; length?: string; rfs?: string; is_planned?: boolean
  owners?: string[] | string; landing_points?: { name: string; country: string }[]; url?: string; notes?: string
}

type MapPopup =
  | { kind: 'cable'; id: string; name: string; lng: number; lat: number }
  | { kind: 'landing'; cables: string[]; cable_count: number; lng: number; lat: number }
  | { kind: 'chokepoint'; name: string; description: string; lng: number; lat: number }

export default function ArgusMap() {
  const mapRef = useRef<MapRef>(null)
  const {
    viewport, setViewport, events, layers, darkMode, toggleDarkMode,
    setSelectedCountry, setSelectedEvent, selectedEvent, setFlyToCallback,
  } = useMapStore()

  const [hoveredEvent, setHoveredEvent] = useState<IntelEvent | null>(null)
  const [cablesGeoJSON, setCablesGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null)
  const [landingPointsGeoJSON, setLandingPointsGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null)
  const [mapPopup, setMapPopup] = useState<MapPopup | null>(null)
  const [cableInfo, setCableInfo] = useState<CableInfo | null>(null)
  const [cableInfoLoading, setCableInfoLoading] = useState(false)
  const [threatenedCableIds, setThreatenedCableIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load cables GeoJSON
  useEffect(() => {
    fetch('/api/cables')
      .then(r => r.json())
      .then(setCablesGeoJSON)
      .catch(() => fetch('/data/cables.json').then(r => r.json()).then(setCablesGeoJSON).catch(() => {}))
  }, [])

  // Load landing points only when toggled on
  useEffect(() => {
    if (!layers.landingPoints || landingPointsGeoJSON) return
    fetch('/data/landing-points.json').then(r => r.json()).then(setLandingPointsGeoJSON).catch(() => {})
  }, [layers.landingPoints, landingPointsGeoJSON])

  // Compute which cables are near active events
  useEffect(() => {
    if (!cablesGeoJSON || !layers.cables || events.length === 0) {
      setThreatenedCableIds(new Set())
      return
    }
    // Only critical events directly on or next to a cable — not broad conflict zones
    const activeEvents = events.filter(e => e.severity === 'critical')
    if (activeEvents.length === 0) { setThreatenedCableIds(new Set()); return }

    const threatened = new Set<string>()
    for (const feature of cablesGeoJSON.features) {
      const cableId = String((feature.properties as Record<string, unknown>)?.id ?? '')
      const lines = (feature.geometry as GeoJSON.MultiLineString).coordinates
      outer: for (const line of lines) {
        // Sample every 4th waypoint for performance
        for (let i = 0; i < line.length; i += 4) {
          const [lon, lat] = line[i]
          for (const ev of activeEvents) {
            if (haversineDistance(ev.lat, ev.lon, lat, lon) < CABLE_THREAT_KM) {
              threatened.add(cableId)
              break outer
            }
          }
        }
      }
    }
    setThreatenedCableIds(threatened)
  }, [cablesGeoJSON, events, layers.cables])

  useEffect(() => {
    setFlyToCallback((lat, lon, zoom) => {
      mapRef.current?.flyTo({ center: [lon, lat], zoom: zoom || 5, duration: 1500 })
    })
  }, [setFlyToCallback])

  // Fetch real TeleGeography metadata when a cable popup opens
  useEffect(() => {
    if (!mapPopup || mapPopup.kind !== 'cable') { setCableInfo(null); return }
    setCableInfo(null)
    setCableInfoLoading(true)
    fetch(`/api/cable-info?id=${encodeURIComponent(mapPopup.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setCableInfo(data); setCableInfoLoading(false) })
      .catch(() => setCableInfoLoading(false))
  }, [mapPopup])

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (!TOKEN) return
    const features = e.features
    if (features && features.length > 0) {
      const feature = features[0]
      const { lng, lat } = e.lngLat
      const layerId = feature.layer?.id
      const props = (feature.properties ?? {}) as Record<string, unknown>

      if (layerId === 'landing-points-layer' || layerId === 'landing-points-hit') {
        const cables = JSON.parse(String(props.cables || '[]')) as string[]
        setMapPopup({ kind: 'landing', cables, cable_count: Number(props.cable_count || 0), lng, lat })
        return
      }
      if (layerId === 'submarine-cables-layer' || layerId === 'submarine-cables-hit' ||
          layerId === 'submarine-cables-threatened' || layerId === 'submarine-cables-threatened-hit') {
        setMapPopup({ kind: 'cable', id: String(props.id ?? ''), name: String(props.name ?? 'Submarine Cable'), lng, lat })
        return
      }
    }
    setMapPopup(null)
    const { lng, lat } = e.lngLat
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=country&access_token=${TOKEN}`)
        const data = await res.json()
        const feat = data.features?.[0]
        if (feat) {
          useMapStore.getState().setSelectedCountry(feat.text || feat.place_name, (feat.properties?.short_code || '').toUpperCase())
        }
      } catch {}
    }, 280)
  }, [])

  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    const canvas = mapRef.current?.getCanvas()
    if (canvas) canvas.style.cursor = e.features && e.features.length > 0 ? 'pointer' : ''
  }, [])

  const filteredEvents = events.filter(e => {
    if (!layers.events) return false
    if (!layers.disasters && (e.category === 'disaster' || e.category === 'earthquake')) return false
    return true
  })

  // Build threatened/safe GeoJSON splits
  const safeCables: GeoJSON.FeatureCollection | null = cablesGeoJSON ? {
    type: 'FeatureCollection',
    features: cablesGeoJSON.features.filter(f => !threatenedCableIds.has(String((f.properties as Record<string,unknown>)?.id ?? ''))),
  } : null

  const threatenedCables: GeoJSON.FeatureCollection | null = cablesGeoJSON && threatenedCableIds.size > 0 ? {
    type: 'FeatureCollection',
    features: cablesGeoJSON.features.filter(f => threatenedCableIds.has(String((f.properties as Record<string,unknown>)?.id ?? ''))),
  } : null

  const interactiveLayerIds: string[] = []
  if (layers.cables && cablesGeoJSON) {
    interactiveLayerIds.push('submarine-cables-hit', 'submarine-cables-layer')
    if (threatenedCables) interactiveLayerIds.push('submarine-cables-threatened-hit', 'submarine-cables-threatened')
  }
  if (layers.landingPoints && landingPointsGeoJSON) interactiveLayerIds.push('landing-points-hit', 'landing-points-layer')

  const mapStyle = darkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1d4ed8', overflow: 'hidden' }}>
      {!TOKEN && (
        <div style={{ position: 'absolute', inset: 0, background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 48, height: 48, background: '#E2E8F0', borderRadius: 8, marginBottom: 16 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Map Requires Mapbox Token</div>
          <div style={{ color: '#475569', maxWidth: 400, textAlign: 'center', lineHeight: 1.5 }}>
            Add your Mapbox public token to <code style={{ background: '#F1F3F5', padding: '2px 6px', borderRadius: 4 }}>.env.local</code> as <code style={{ background: '#F1F3F5', padding: '2px 6px', borderRadius: 4 }}>NEXT_PUBLIC_MAPBOX_TOKEN</code>
          </div>
        </div>
      )}

      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        title={darkMode ? 'Switch to light map' : 'Switch to dark map'}
        style={{
          position: 'absolute', bottom: 100, right: 12, zIndex: 50,
          width: 32, height: 32, borderRadius: 6,
          background: darkMode ? '#1e293b' : 'white',
          border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
          color: darkMode ? '#94A3B8' : '#475569',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 15, boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        }}
      >
        {darkMode ? '☀' : '☾'}
      </button>

      {TOKEN && (
        <Map
          ref={mapRef}
          mapboxAccessToken={TOKEN}
          mapStyle={mapStyle}
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
          fog={darkMode ? {
            color: '#0f172a',
            'high-color': '#1e293b',
            'horizon-blend': 0.02,
            'space-color': '#020617',
            'star-intensity': 0.8,
          } as Parameters<typeof Map>[0]['fog'] : {
            color: 'white',
            'high-color': '#acc0c0',
            'horizon-blend': 0.02,
            'space-color': '#1d4ed8',
            'star-intensity': 0.3,
          } as Parameters<typeof Map>[0]['fog']}
        >
          <NavigationControl position="bottom-right" />

          {/* Chokepoints */}
          {layers.chokepoints && CHOKEPOINTS.map(cp => (
            <Marker key={cp.name} latitude={cp.lat} longitude={cp.lon}>
              <div
                onClick={() => setMapPopup({ kind: 'chokepoint', name: cp.name, description: cp.description, lng: cp.lon, lat: cp.lat })}
                style={{
                  width: 13, height: 13, borderRadius: '50%',
                  background: darkMode ? '#60a5fa' : '#1D4ED8',
                  border: '2px solid white', cursor: 'pointer',
                  boxShadow: '0 0 0 3px rgba(29,78,216,0.3)',
                }}
              />
            </Marker>
          ))}

          {/* Safe cables */}
          {layers.cables && safeCables && (
            <Source id="submarine-cables" type="geojson" data={safeCables}>
              <Layer id="submarine-cables-layer" type="line" paint={{
                'line-color': ['coalesce', ['get', 'color'], '#6366f1'],
                'line-width': 1, 'line-opacity': 0.5,
              }} />
              <Layer id="submarine-cables-hit" type="line" paint={{ 'line-width': 12, 'line-opacity': 0 }} />
            </Source>
          )}

          {/* Threatened cables — red highlight */}
          {layers.cables && threatenedCables && (
            <Source id="submarine-cables-threatened" type="geojson" data={threatenedCables}>
              <Layer id="submarine-cables-threatened" type="line" paint={{
                'line-color': '#ef4444',
                'line-width': 2,
                'line-opacity': 0.85,
              }} />
              <Layer id="submarine-cables-threatened-hit" type="line" paint={{ 'line-width': 12, 'line-opacity': 0 }} />
            </Source>
          )}

          {/* Landing points */}
          {layers.landingPoints && landingPointsGeoJSON && (
            <Source id="landing-points" type="geojson" data={landingPointsGeoJSON}>
              <Layer id="landing-points-hit" type="circle" paint={{ 'circle-radius': 14, 'circle-opacity': 0, 'circle-stroke-width': 0 }} />
              <Layer id="landing-points-layer" type="circle" paint={{
                'circle-radius': ['interpolate', ['linear'], ['get', 'cable_count'], 1, 3, 3, 4.5, 6, 6, 10, 8],
                'circle-color': darkMode ? '#e2e8f0' : '#1e293b',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': darkMode ? '#1e293b' : '#ffffff',
                'circle-opacity': 0.9,
              }} />
            </Source>
          )}

          {/* Popups for cables / landing points / chokepoints */}
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
              {mapPopup.kind === 'chokepoint' && (
                <div style={{ padding: '10px 12px', minWidth: 200, maxWidth: 260 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Strategic Chokepoint</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 5 }}>{mapPopup.name}</div>
                  <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{mapPopup.description}</div>
                </div>
              )}

              {mapPopup.kind === 'cable' && (
                <div style={{ padding: '10px 12px', minWidth: 220, maxWidth: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: threatenedCableIds.has(mapPopup.id) ? '#ef4444' : '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {threatenedCableIds.has(mapPopup.id) ? 'At-Risk Cable' : 'Submarine Cable'}
                    </div>
                    {threatenedCableIds.has(mapPopup.id) && (
                      <div style={{ fontSize: 9, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>THREAT ZONE</div>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{mapPopup.name}</div>
                  {cableInfoLoading && <div style={{ fontSize: 11, color: '#94A3B8' }}>Loading details…</div>}
                  {cableInfo && !cableInfoLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {cableInfo.length && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 10, color: '#94A3B8' }}>Length</span><span style={{ fontSize: 10, fontWeight: 600, color: '#334155' }}>{cableInfo.length}</span></div>}
                      {cableInfo.rfs && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 10, color: '#94A3B8' }}>Ready for Service</span><span style={{ fontSize: 10, fontWeight: 600, color: '#334155' }}>{cableInfo.rfs}</span></div>}
                      {cableInfo.is_planned && <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>Planned / Under Construction</div>}
                      {cableInfo.landing_points && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 10, color: '#94A3B8' }}>Landing Points</span><span style={{ fontSize: 10, fontWeight: 600, color: '#334155' }}>{cableInfo.landing_points.length}</span></div>}
                      {cableInfo.owners && (
                        <div style={{ marginTop: 4 }}>
                          <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Owners</div>
                          <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.5 }}>
                            {Array.isArray(cableInfo.owners)
                              ? cableInfo.owners.slice(0, 4).join(', ') + (cableInfo.owners.length > 4 ? ` +${cableInfo.owners.length - 4} more` : '')
                              : String(cableInfo.owners)}
                          </div>
                        </div>
                      )}
                      {cableInfo.url && (
                        <a href={cableInfo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#1D4ED8', marginTop: 4, textDecoration: 'none' }}>View details →</a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {mapPopup.kind === 'landing' && (
                <div style={{ padding: '10px 12px', minWidth: 200, maxWidth: 260 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#0891B2', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                    Landing Station · {mapPopup.cable_count} cable{mapPopup.cable_count !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

          {/* Event markers */}
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

          {/* Event popup */}
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
                    <span style={{ fontSize: 9, fontWeight: 800, color: SEVERITY_COLORS[ev.severity], textTransform: 'uppercase', letterSpacing: '0.1em' }}>{ev.severity}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CBD5E1', display: 'inline-block' }} />
                    <span style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ev.source}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', lineHeight: 1.4, marginBottom: 5 }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, marginBottom: 9 }}>{ev.summary}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>{ev.country} · {formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}</span>
                    {ev.fatalities && <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: '#DC2626' }}>{ev.fatalities} KIA</span>}
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
