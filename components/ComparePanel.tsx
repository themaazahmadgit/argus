'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useMapStore } from '@/stores/mapStore'
import { CountryProfile } from '@/types'
import { X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COUNTRY_LIST = [
  { name: 'Russia', code: 'RU' }, { name: 'China', code: 'CN' }, { name: 'Iran', code: 'IR' },
  { name: 'Ukraine', code: 'UA' }, { name: 'Israel', code: 'IL' }, { name: 'Yemen', code: 'YE' },
  { name: 'Sudan', code: 'SD' }, { name: 'United States', code: 'US' }, { name: 'India', code: 'IN' },
  { name: 'Pakistan', code: 'PK' }, { name: 'Turkey', code: 'TR' }, { name: 'Saudi Arabia', code: 'SA' },
  { name: 'Nigeria', code: 'NG' }, { name: 'Ethiopia', code: 'ET' }, { name: 'North Korea', code: 'KP' },
  { name: 'Afghanistan', code: 'AF' }, { name: 'Taiwan', code: 'TW' }, { name: 'Syria', code: 'SY' },
  { name: 'Venezuela', code: 'VE' }, { name: 'Myanmar', code: 'MM' },
]

export default function ComparePanel() {
  const { togglePanel, selectedCountryCode } = useMapStore()
  const [codeA, setCodeA] = useState(selectedCountryCode || 'UA')
  const [codeB, setCodeB] = useState('RU')

  const { data: profileA } = useQuery<CountryProfile>({
    queryKey: ['country', codeA],
    queryFn: () => fetch(`/api/country/${codeA}`).then(r => r.json()),
    enabled: !!codeA,
  })
  const { data: profileB } = useQuery<CountryProfile>({
    queryKey: ['country', codeB],
    queryFn: () => fetch(`/api/country/${codeB}`).then(r => r.json()),
    enabled: !!codeB,
  })

  const metrics = [
    { key: 'riskScore', label: 'Risk Score', format: (v: number) => v, unit: '/100' },
    { key: 'freedomScore', label: 'Freedom Score', format: (v: number) => v, unit: '/100' },
    { key: 'fragilityScore', label: 'Fragility Score', format: (v: number) => v, unit: '/120' },
    { key: 'gdpGrowth', label: 'GDP Growth', format: (v: number) => v.toFixed(1), unit: '%' },
    { key: 'inflation', label: 'Inflation', format: (v: number) => v.toFixed(1), unit: '%' },
    { key: 'militarySpending', label: 'Military Spending', format: (v: number) => v.toFixed(1), unit: '% GDP' },
  ]

  const chartData = metrics.map(m => ({
    name: m.label,
    [profileA?.name || 'A']: profileA?.[m.key as keyof CountryProfile] as number || 0,
    [profileB?.name || 'B']: profileB?.[m.key as keyof CountryProfile] as number || 0,
  }))

  return (
    <div className="panel-right-wide panel-slide-in" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Country Comparison</span>
        <button onClick={() => togglePanel('compare')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
      </div>

      <div style={{ padding: '16px', display: 'flex', gap: 12 }}>
        {[{ code: codeA, set: setCodeA, label: 'Country A', color: '#1D4ED8' }, { code: codeB, set: setCodeB, label: 'Country B', color: '#DC2626' }].map(({ code, set, label, color }) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <select
              value={code}
              onChange={e => set(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', border: `1px solid ${color}40`, borderRadius: 6, fontSize: 12, background: `${color}08`, color: '#0F172A', outline: 'none' }}
            >
              {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div style={{ padding: '0 16px' }}>
        {metrics.map(m => {
          const a = profileA?.[m.key as keyof CountryProfile] as number || 0
          const b = profileB?.[m.key as keyof CountryProfile] as number || 0
          const aWins = a > b
          return (
            <div key={m.key} style={{ padding: '8px 0', borderBottom: '1px solid #F1F3F5', display: 'grid', gridTemplateColumns: '1fr minmax(80px,110px) 1fr', alignItems: 'center', gap: 6 }}>
              <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: aWins ? '#1D4ED8' : '#475569', textAlign: 'right' }}>
                {m.format(a)}<span style={{ fontSize: 10, fontWeight: 400 }}>{m.unit}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: 10, color: '#94A3B8' }}>{m.label}</div>
              <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: !aWins ? '#DC2626' : '#475569', textAlign: 'left' }}>
                {m.format(b)}<span style={{ fontSize: 10, fontWeight: 400 }}>{m.unit}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      {profileA && profileB && (
        <div style={{ padding: '16px' }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Visual Comparison</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey={profileA.name} fill="#1D4ED8" radius={[0, 3, 3, 0]} />
              <Bar dataKey={profileB.name} fill="#DC2626" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, background: '#1D4ED8', borderRadius: 2, display: 'inline-block' }} />{profileA.name}</span>
            <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, background: '#DC2626', borderRadius: 2, display: 'inline-block' }} />{profileB.name}</span>
          </div>
        </div>
      )}
    </div>
  )
}
