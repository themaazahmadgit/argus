'use client'
import { useMapStore } from '@/stores/mapStore'
import { X } from 'lucide-react'
import { SEVERITY_COLORS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'

const SEV_LABEL: Record<string, string> = { critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM' }

export default function AlertsPanel() {
  const { alerts, togglePanel, flyTo } = useMapStore()
  const critical = alerts.filter(a => a.severity === 'critical').length

  return (
    <div className="panel-right panel-slide-in">
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Correlation Alerts</span>
          <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: '#1D4ED8' }}>{alerts.length}</span>
          {critical > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{critical} Critical</span>
          )}
        </div>
        <button onClick={() => togglePanel('alerts')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {alerts.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>No correlation alerts</div>
            <div style={{ fontSize: 10, color: '#CBD5E1' }}>Load events to run pattern analysis</div>
          </div>
        )}
        {alerts.map(alert => {
          const color = SEVERITY_COLORS[alert.severity]
          return (
            <div key={alert.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
              {/* Top stripe */}
              <div style={{ height: 2, background: color }} />
              <div style={{ padding: '12px 14px' }}>
                {/* Badge + pattern */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {SEV_LABEL[alert.severity]}
                  </span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CBD5E1', display: 'inline-block' }} />
                  <span style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{alert.pattern}</span>
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', marginBottom: 5, lineHeight: 1.4 }}>{alert.title}</div>
                <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>{alert.summary}</div>

                {/* Confidence */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confidence</span>
                    <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, color: '#0F172A' }}>{alert.confidence}%</span>
                  </div>
                  <div style={{ height: 3, background: '#F1F3F5', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${alert.confidence}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>

                {/* Countries */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                  {alert.countries.map(c => (
                    <span key={c} style={{ fontSize: 9, background: '#F8F9FA', border: '1px solid #E2E8F0', padding: '2px 7px', borderRadius: 4, color: '#475569', fontWeight: 500 }}>{c}</span>
                  ))}
                </div>

                {/* Signals */}
                <div style={{ marginBottom: 10, padding: '8px 10px', background: '#F8F9FA', borderRadius: 6 }}>
                  <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Trigger Signals</div>
                  {alert.signals.slice(0, 3).map((s, i) => (
                    <div key={i} style={{ fontSize: 10, color: '#475569', lineHeight: 1.4, padding: '2px 0', borderTop: i > 0 ? '1px solid #F1F3F5' : 'none' }}>
                      {s}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: '#94A3B8' }}>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                  <button
                    onClick={() => flyTo(alert.lat, alert.lon, 5)}
                    style={{ fontSize: 10, color: '#1D4ED8', background: 'none', border: '1px solid #BFDBFE', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Focus Map
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
