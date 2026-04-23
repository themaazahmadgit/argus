'use client'
import { Marker, Popup } from 'react-map-gl/mapbox'
import { useState } from 'react'
import { useMapStore } from '@/stores/mapStore'
import { useAuth } from '@/lib/auth/AuthContext'
import { useWorkspace } from '@/lib/hooks/useWorkspace'
import { usePlots } from '@/lib/hooks/usePlots'
import { Plot } from '@/types'
import { SEVERITY_COLORS } from '@/lib/constants'
import { Trash2 } from 'lucide-react'

export default function PlotsLayer() {
  const { layers } = useMapStore()
  const { isAuthenticated } = useAuth()
  const { workspace } = useWorkspace()
  const { plots, deletePlot } = usePlots(workspace?.id)
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)

  if (!layers.plots || !isAuthenticated) return null

  return (
    <>
      {plots.map(plot => {
        if (plot.type === 'point' && Array.isArray(plot.geometry.coordinates) && typeof plot.geometry.coordinates[0] === 'number') {
          const [lon, lat] = plot.geometry.coordinates as number[]
          const color = SEVERITY_COLORS[plot.threat_level as keyof typeof SEVERITY_COLORS] || '#64748B'
          return (
            <Marker key={plot.id} latitude={lat} longitude={lon} onClick={() => setSelectedPlot(plot)}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: '2px solid white', boxShadow: `0 0 0 2px ${color}60` }} />
                <div style={{ fontSize: 9, color, fontWeight: 700, background: 'white', padding: '1px 4px', borderRadius: 3, marginTop: 2, whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                  {plot.title.slice(0, 20)}
                </div>
              </div>
            </Marker>
          )
        }
        return null
      })}

      {selectedPlot && selectedPlot.type === 'point' && typeof (selectedPlot.geometry.coordinates as number[])[0] === 'number' && (
        <Popup
          latitude={(selectedPlot.geometry.coordinates as number[])[1]}
          longitude={(selectedPlot.geometry.coordinates as number[])[0]}
          onClose={() => setSelectedPlot(null)}
          anchor="bottom"
        >
          <div style={{ padding: 14, minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{selectedPlot.title}</div>
                <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase' }}>{selectedPlot.category} · {selectedPlot.threat_level}</div>
              </div>
              <button
                onClick={() => { deletePlot(selectedPlot.id); setSelectedPlot(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 2 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
            {selectedPlot.notes && <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{selectedPlot.notes}</div>}
          </div>
        </Popup>
      )}
    </>
  )
}
