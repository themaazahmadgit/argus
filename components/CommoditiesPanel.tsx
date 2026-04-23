'use client'
import { useQuery } from '@tanstack/react-query'
import { useMapStore } from '@/stores/mapStore'
import { Commodity } from '@/types'
import { X } from 'lucide-react'

export default function CommoditiesPanel() {
  const { togglePanel } = useMapStore()
  const { data: commodities, isLoading } = useQuery<Commodity[]>({
    queryKey: ['commodities'],
    queryFn: () => fetch('/api/commodities').then(r => r.json()),
    refetchInterval: 120000,
  })

  return (
    <div className="panel-right panel-slide-in">
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Markets</span>
        <button onClick={() => togglePanel('commodities')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading && Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #F1F3F5' }}>
            <div className="skeleton" style={{ height: 12, width: 80, borderRadius: 3, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 18, width: 120, borderRadius: 3 }} />
          </div>
        ))}
        {(commodities || []).map(c => {
          const up = c.trend === 'up'
          const down = c.trend === 'down'
          const changeColor = up ? '#16A34A' : down ? '#DC2626' : '#94A3B8'
          return (
            <div key={c.symbol} style={{ padding: '11px 16px', borderBottom: '1px solid #F1F3F5', display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Symbol */}
              <div style={{ width: 48, flexShrink: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.symbol}</div>
              </div>

              {/* Name + price */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  {c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Change */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: changeColor }}>
                  {c.changePercent > 0 ? '+' : ''}{c.changePercent.toFixed(2)}%
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: '#94A3B8', marginTop: 1 }}>
                  {c.change > 0 ? '+' : ''}{c.change.toFixed(2)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '7px 16px', borderTop: '1px solid #F1F3F5', fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
        Refreshes every 2 min
      </div>
    </div>
  )
}
