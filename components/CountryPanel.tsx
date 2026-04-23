'use client'
import { useQuery } from '@tanstack/react-query'
import { useMapStore } from '@/stores/mapStore'
import { CountryProfile } from '@/types'
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SEVERITY_COLORS } from '@/lib/constants'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDistanceToNow } from 'date-fns'

function RiskGauge({ score }: { score: number }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const dashoffset = circ * (1 - score / 100)
  const color = score < 30 ? '#16A34A' : score < 60 ? '#D97706' : score < 80 ? '#EA580C' : '#DC2626'
  const label = score < 30 ? 'LOW' : score < 60 ? 'MODERATE' : score < 80 ? 'HIGH' : 'CRITICAL'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg width={88} height={88} viewBox="0 0 96 96">
        <circle cx={48} cy={48} r={r} fill="none" stroke="#F1F3F5" strokeWidth={7} />
        <circle cx={48} cy={48} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={dashoffset}
          strokeLinecap="round" transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
        <text x={48} y={44} textAnchor="middle" fontSize={24} fontWeight={700} fill={color} fontFamily="JetBrains Mono, monospace">{score}</text>
        <text x={48} y={58} textAnchor="middle" fontSize={8} fill="#94A3B8" fontFamily="Inter, sans-serif" letterSpacing="1">/100</text>
      </svg>
      <div>
        <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Risk Score</div>
        <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.05em' }}>{label}</div>
      </div>
    </div>
  )
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ height: 3, background: '#F1F3F5', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 2, transition: 'width 400ms ease' }} />
    </div>
  )
}

export default function CountryPanel() {
  const { selectedCountry, selectedCountryCode, togglePanel, flyTo } = useMapStore()

  const { data: profile, isLoading } = useQuery<CountryProfile>({
    queryKey: ['country', selectedCountryCode],
    queryFn: () => fetch(`/api/country/${selectedCountryCode}`).then(r => r.json()),
    enabled: !!selectedCountryCode && selectedCountryCode !== 'XX',
  })

  if (!selectedCountry) return null

  const formatGDP = (v: number) => {
    if (!v) return '—'
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
    return `$${(v / 1e6).toFixed(0)}M`
  }

  const SkeletonLine = ({ w }: { w: number }) => (
    <div className="skeleton" style={{ width: w, height: 13, borderRadius: 3 }} />
  )

  return (
    <div className="panel-right panel-slide-in" style={{ overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Country code badge */}
        <div style={{
          width: 44, height: 44, background: '#0F172A', borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em',
        }}>
          {(selectedCountryCode || '??').slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
              <SkeletonLine w={160} />
              <SkeletonLine w={100} />
            </div>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{profile?.name || selectedCountry}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {[profile?.capital, profile?.region].filter(Boolean).join(' · ')}
              </div>
            </>
          )}
        </div>
        <button onClick={() => togglePanel('country')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2, flexShrink: 0 }}>
          <X size={15} />
        </button>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Risk Gauge + Population */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isLoading ? <div className="skeleton" style={{ width: 200, height: 88, borderRadius: 8 }} /> : <RiskGauge score={profile?.riskScore || 0} />}
          {!isLoading && profile?.population ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Population</div>
              <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                {(profile.population / 1e6).toFixed(1)}<span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 400 }}>M</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Economic Indicators */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Economic Indicators</div>
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 6 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'GDP', value: formatGDP(profile?.gdp || 0), mono: true },
                {
                  label: 'GDP Growth', mono: true,
                  value: profile?.gdpGrowth !== undefined ? `${profile.gdpGrowth > 0 ? '+' : ''}${profile.gdpGrowth.toFixed(1)}%` : '—',
                  color: profile?.gdpGrowth !== undefined ? (profile.gdpGrowth > 0 ? '#16A34A' : '#DC2626') : undefined,
                },
                {
                  label: 'Inflation', mono: true,
                  value: profile?.inflation !== undefined ? `${profile.inflation.toFixed(1)}%` : '—',
                  color: profile?.inflation !== undefined ? (profile.inflation > 10 ? '#DC2626' : profile.inflation > 5 ? '#D97706' : '#0F172A') : undefined,
                },
                { label: 'Military', mono: true, value: profile?.militarySpending ? `${profile.militarySpending.toFixed(1)}% GDP` : '—' },
              ].map(item => (
                <div key={item.label} style={{ padding: '9px 11px', background: '#F8F9FA', borderRadius: 7, border: '1px solid #F1F3F5' }}>
                  <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</div>
                  <div className={item.mono ? 'font-mono' : ''} style={{ fontSize: 13, fontWeight: 700, color: item.color || '#0F172A' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GDP Trend Chart */}
        {!isLoading && profile?.economicHistory && profile.economicHistory.length > 1 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>GDP Trend</div>
            <ResponsiveContainer width="100%" height={72}>
              <LineChart data={profile.economicHistory} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: unknown) => [`$${(v as number).toFixed(0)}B`, 'GDP']}
                  contentStyle={{ fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 6, boxShadow: 'none' }}
                />
                <Line type="monotone" dataKey="gdp" stroke="#1D4ED8" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Governance */}
        {!isLoading && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Governance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>Freedom Index</span>
                  <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>{profile?.freedomScore ?? '—'}/100</span>
                </div>
                <ScoreBar value={profile?.freedomScore || 0} color="#16A34A" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>Fragility Index</span>
                  <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>{profile?.fragilityScore ?? '—'}/120</span>
                </div>
                <ScoreBar value={profile?.fragilityScore || 0} max={120} color="#EA580C" />
              </div>
            </div>
          </div>
        )}

        {/* Recent Events */}
        {!isLoading && profile?.recentEvents && profile.recentEvents.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Recent Intelligence — {profile.recentEvents.length} events
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {profile.recentEvents.slice(0, 5).map(e => (
                <div
                  key={e.id}
                  onClick={() => { flyTo(e.lat, e.lon, 6); useMapStore.getState().setSelectedEvent(e) }}
                  style={{
                    padding: '7px 10px', borderRadius: 5, cursor: 'pointer',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    border: '1px solid transparent', transition: 'all 100ms',
                  }}
                  onMouseEnter={e2 => { (e2.currentTarget as HTMLElement).style.background = '#F8F9FA'; (e2.currentTarget as HTMLElement).style.borderColor = '#E2E8F0' }}
                  onMouseLeave={e2 => { (e2.currentTarget as HTMLElement).style.background = 'transparent'; (e2.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
                >
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: SEVERITY_COLORS[e.severity], flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#0F172A', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                    <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2 }}>{formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <button
            onClick={() => togglePanel('brief')}
            style={{ padding: '10px 16px', background: '#0F172A', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 12, letterSpacing: '-0.01em' }}
          >
            Generate Intelligence Brief
          </button>
          <button
            onClick={() => togglePanel('compare')}
            style={{ padding: '10px 16px', background: '#F8F9FA', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 7, cursor: 'pointer', fontWeight: 500, fontSize: 12 }}
          >
            Compare with another country
          </button>
        </div>
      </div>
    </div>
  )
}
