'use client'
import { useMapStore } from '@/stores/mapStore'
import { X } from 'lucide-react'
import { SEVERITY_COLORS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'

export default function SituationsPanel() {
  const { situations, events, togglePanel, flyTo, setSelectedCountry } = useMapStore()

  return (
    <div className="panel-right panel-slide-in">
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Situations</span>
          <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: '#1D4ED8' }}>{situations.length}</span>
        </div>
        <button onClick={() => togglePanel('situations')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {situations.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>No active situations detected</div>
            <div style={{ fontSize: 10, color: '#CBD5E1' }}>Load events to begin situation analysis</div>
          </div>
        )}
        {situations.map(sit => (
          <div key={sit.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ height: 2, background: sit.criticalCount > 0 ? SEVERITY_COLORS.critical : sit.highCount > 0 ? SEVERITY_COLORS.high : SEVERITY_COLORS.medium }} />
            <div style={{ padding: '12px 14px' }}>
              {/* Name + trend */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', lineHeight: 1.4, flex: 1 }}>{sit.name}</div>
                <TrendLabel trend={sit.trend} pct={sit.trendPercent} />
              </div>

              {/* Severity counts */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                {sit.criticalCount > 0 && <SevCount label="Critical" count={sit.criticalCount} color={SEVERITY_COLORS.critical} />}
                {sit.highCount > 0 && <SevCount label="High" count={sit.highCount} color={SEVERITY_COLORS.high} />}
                {sit.mediumCount > 0 && <SevCount label="Medium" count={sit.mediumCount} color={SEVERITY_COLORS.medium} />}
                <span className="font-mono" style={{ fontSize: 10, color: '#94A3B8', marginLeft: 'auto' }}>{sit.eventCount} total</span>
              </div>

              {/* Top events */}
              <div style={{ marginBottom: 10 }}>
                {sit.topEvents.slice(0, 3).map((e, i) => (
                  <div key={e.id} style={{ display: 'flex', gap: 8, padding: '4px 0', alignItems: 'flex-start', borderTop: i > 0 ? '1px solid #F8F9FA' : 'none' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: SEVERITY_COLORS[e.severity], flexShrink: 0, marginTop: 5 }} />
                    <span style={{ fontSize: 10, color: '#475569', lineHeight: 1.4 }}>{e.title}</span>
                  </div>
                ))}
              </div>

              {/* Sources */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {sit.sources.map(s => (
                  <span key={s} style={{ fontSize: 9, background: '#F8F9FA', border: '1px solid #E2E8F0', padding: '2px 6px', borderRadius: 3, color: '#475569', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>{s}</span>
                ))}
              </div>

              <div style={{ fontSize: 9, color: '#94A3B8', marginBottom: 10 }}>
                Active {formatDistanceToNow(new Date(sit.activeSince), { addSuffix: true })}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => flyTo(sit.lat, sit.lon, 5)}
                  style={{ flex: 1, fontSize: 10, color: '#1D4ED8', background: 'none', border: '1px solid #BFDBFE', padding: '5px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                >
                  Focus Map
                </button>
                <button
                  onClick={() => { setSelectedCountry(sit.countries[0], ''); flyTo(sit.lat, sit.lon, 5) }}
                  style={{ flex: 1, fontSize: 10, color: '#475569', background: '#F8F9FA', border: '1px solid #E2E8F0', padding: '5px 8px', borderRadius: 4, cursor: 'pointer' }}
                >
                  Country Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 16px', borderTop: '1px solid #F1F3F5', fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {events.length} events — {situations.length} situations
      </div>
    </div>
  )
}

function TrendLabel({ trend, pct }: { trend: string; pct: number }) {
  const color = trend === 'escalating' ? '#DC2626' : trend === 'de-escalating' ? '#16A34A' : '#D97706'
  const arrow = trend === 'escalating' ? '↑' : trend === 'de-escalating' ? '↓' : '—'
  return (
    <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, color, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {arrow} {pct > 0 ? '+' : ''}{pct}%
    </span>
  )
}

function SevCount({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <span style={{ fontSize: 9, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {count} {label}
    </span>
  )
}
