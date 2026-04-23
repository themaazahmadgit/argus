'use client'
import { useState } from 'react'
import { useMapStore } from '@/stores/mapStore'
import { useAuth } from '@/lib/auth/AuthContext'
import { MapPin, Circle, Pen, Square } from 'lucide-react'

const TOOLS = [
  { key: 'point', label: 'Point', icon: MapPin },
  { key: 'zone', label: 'Zone', icon: Circle },
  { key: 'draw', label: 'Draw', icon: Pen },
  { key: 'zone-builder', label: 'Zone Builder', icon: Square },
]

export default function PlottingTools() {
  const { plottingMode, setPlottingMode, togglePanel } = useMapStore()
  const { isAuthenticated } = useAuth()

  const handleToolClick = (mode: string) => {
    if (!isAuthenticated) {
      togglePanel('authModal')
      return
    }
    setPlottingMode(plottingMode === mode ? 'none' : mode as typeof plottingMode)
  }

  return (
    <div style={{ position: 'absolute', bottom: 48, right: 12, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 50 }}>
      <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 2, fontWeight: 700 }}>Plot</div>
      {TOOLS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => handleToolClick(key)}
          title={label}
          style={{
            width: 36, height: 36, borderRadius: 8, border: '1px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms',
            background: plottingMode === key ? '#1D4ED8' : 'white',
            borderColor: plottingMode === key ? '#1D4ED8' : '#E2E8F0',
            color: plottingMode === key ? 'white' : '#475569',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Icon size={15} />
        </button>
      ))}
      {plottingMode !== 'none' && (
        <button
          onClick={() => setPlottingMode('none')}
          style={{ padding: '3px 6px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 5, cursor: 'pointer', fontSize: 9, fontWeight: 700 }}
        >
          CANCEL
        </button>
      )}
    </div>
  )
}
