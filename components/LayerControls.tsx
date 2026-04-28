'use client'
import { useMapStore } from '@/stores/mapStore'
import { useAuth } from '@/lib/auth/AuthContext'
import { MapPin, Circle, Pen, Square } from 'lucide-react'

const LAYERS = [
  { key: 'events', label: 'Events' },
  { key: 'disasters', label: 'Disasters' },
  { key: 'chokepoints', label: 'Chokepoints' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'cables', label: 'Cables' },
  { key: 'landingPoints', label: 'Landings' },
  { key: 'aviation', label: 'Aviation' },
  { key: 'vessels', label: 'Vessels' },
  { key: 'plots', label: 'Plots' },
]

const PLOT_TOOLS = [
  { key: 'point', label: 'Point', icon: MapPin },
  { key: 'zone', label: 'Zone', icon: Circle },
  { key: 'draw', label: 'Draw', icon: Pen },
  { key: 'zone-builder', label: 'Area', icon: Square },
]

export default function LayerControls() {
  const { layers, toggleLayer, plottingMode, setPlottingMode, togglePanel } = useMapStore()
  const { isAuthenticated } = useAuth()

  const handlePlotTool = (mode: string) => {
    if (!isAuthenticated) { togglePanel('authModal'); return }
    setPlottingMode(plottingMode === mode ? 'none' : mode as typeof plottingMode)
  }

  return (
    <div style={{
      position: 'absolute', top: 12, right: 12, zIndex: 50,
      background: 'white', border: '1px solid #E2E8F0', borderRadius: 8,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      width: 120, overflow: 'hidden',
      maxWidth: 'calc(100% - 24px)',   /* never wider than map container */
    }}>
      {/* Layers */}
      <div style={{ padding: '9px 10px 8px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Layers</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {LAYERS.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={layers[key as keyof typeof layers]}
                onChange={() => toggleLayer(key as keyof typeof layers)}
                style={{ accentColor: '#1D4ED8', width: 12, height: 12, flexShrink: 0 }}
              />
              <span style={{ fontSize: 11, color: layers[key as keyof typeof layers] ? '#0F172A' : '#94A3B8', transition: 'color 100ms' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#F1F3F5' }} />

      {/* Plot tools */}
      <div style={{ padding: '9px 10px 10px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Plot</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {PLOT_TOOLS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handlePlotTool(key)}
              title={label}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2,
                padding: '5px 2px', border: '1px solid', borderRadius: 5, cursor: 'pointer', transition: 'all 100ms',
                background: plottingMode === key ? '#1D4ED8' : '#F8F9FA',
                borderColor: plottingMode === key ? '#1D4ED8' : '#E2E8F0',
                color: plottingMode === key ? 'white' : '#64748B',
              }}
            >
              <Icon size={12} />
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</span>
            </button>
          ))}
        </div>
        {plottingMode !== 'none' && (
          <button
            onClick={() => setPlottingMode('none')}
            style={{ marginTop: 6, width: '100%', padding: '4px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 4, cursor: 'pointer', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
