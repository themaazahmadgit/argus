'use client'
import { useState } from 'react'
import { useMapStore } from '@/stores/mapStore'
import { X } from 'lucide-react'
import { FREEDOM_SCORES, FRAGILITY_SCORES } from '@/lib/constants'

const COUNTRIES = [
  { name: 'Russia', code: 'RU', lat: 60.0, lon: 90.0 },
  { name: 'China', code: 'CN', lat: 35.0, lon: 105.0 },
  { name: 'Iran', code: 'IR', lat: 32.4, lon: 53.7 },
  { name: 'Ukraine', code: 'UA', lat: 48.5, lon: 31.0 },
  { name: 'Israel', code: 'IL', lat: 31.5, lon: 34.9 },
  { name: 'Yemen', code: 'YE', lat: 15.5, lon: 48.5 },
  { name: 'Sudan', code: 'SD', lat: 15.5, lon: 32.5 },
  { name: 'Myanmar', code: 'MM', lat: 17.0, lon: 96.0 },
  { name: 'Pakistan', code: 'PK', lat: 30.0, lon: 70.0 },
  { name: 'North Korea', code: 'KP', lat: 40.3, lon: 127.5 },
  { name: 'Syria', code: 'SY', lat: 35.0, lon: 38.0 },
  { name: 'Ethiopia', code: 'ET', lat: 9.1, lon: 40.5 },
  { name: 'Somalia', code: 'SO', lat: 5.0, lon: 45.0 },
  { name: 'Mali', code: 'ML', lat: 17.6, lon: -4.0 },
  { name: 'Nigeria', code: 'NG', lat: 9.1, lon: 8.7 },
  { name: 'Venezuela', code: 'VE', lat: 6.4, lon: -66.6 },
  { name: 'Taiwan', code: 'TW', lat: 23.7, lon: 121.0 },
  { name: 'Afghanistan', code: 'AF', lat: 33.9, lon: 67.7 },
  { name: 'Saudi Arabia', code: 'SA', lat: 24.7, lon: 46.7 },
  { name: 'Turkey', code: 'TR', lat: 38.9, lon: 35.2 },
  { name: 'Iraq', code: 'IQ', lat: 33.2, lon: 43.7 },
  { name: 'Lebanon', code: 'LB', lat: 33.9, lon: 35.9 },
  { name: 'Libya', code: 'LY', lat: 26.3, lon: 17.2 },
  { name: 'Egypt', code: 'EG', lat: 26.8, lon: 30.8 },
  { name: 'India', code: 'IN', lat: 20.6, lon: 78.9 },
  { name: 'Palestine', code: 'PS', lat: 31.9, lon: 35.2 },
  { name: 'Colombia', code: 'CO', lat: 4.6, lon: -74.1 },
  { name: 'Mexico', code: 'MX', lat: 23.6, lon: -102.6 },
  { name: 'Philippines', code: 'PH', lat: 12.9, lon: 121.8 },
  { name: 'United States', code: 'US', lat: 37.1, lon: -95.7 },
  { name: 'United Kingdom', code: 'GB', lat: 55.4, lon: -3.4 },
  { name: 'France', code: 'FR', lat: 46.2, lon: 2.2 },
  { name: 'Germany', code: 'DE', lat: 51.2, lon: 10.5 },
  { name: 'Japan', code: 'JP', lat: 36.2, lon: 138.3 },
  { name: 'South Korea', code: 'KR', lat: 36.5, lon: 127.8 },
  { name: 'DR Congo', code: 'CD', lat: -4.0, lon: 21.8 },
  { name: 'Haiti', code: 'HT', lat: 18.9, lon: -72.3 },
  { name: 'Central African Republic', code: 'CF', lat: 6.6, lon: 20.9 },
  { name: 'South Sudan', code: 'SS', lat: 6.9, lon: 31.3 },
  { name: 'Belarus', code: 'BY', lat: 53.9, lon: 27.6 },
]

export default function CountriesPanel() {
  const { togglePanel, flyTo, setSelectedCountry, events } = useMapStore()
  const [search, setSearch] = useState('')

  const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const getEventCount = (code: string) => events.filter(e => e.countryCode === code).length

  const getRisk = (code: string) => {
    const freedom = FREEDOM_SCORES[code] ?? 50
    const fragility = FRAGILITY_SCORES[code] ?? 40
    const eventCount = getEventCount(code)
    const score = Math.min(95, 30 + (100 - freedom) * 0.2 + fragility * 0.2 + Math.min(20, eventCount * 3))
    const color = score < 30 ? '#16A34A' : score < 60 ? '#D97706' : score < 80 ? '#EA580C' : '#DC2626'
    const label = score < 30 ? 'LOW' : score < 60 ? 'MOD' : score < 80 ? 'HIGH' : 'CRIT'
    return { score: Math.round(score), color, label }
  }

  return (
    <div className="panel-right panel-slide-in">
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Countries</span>
        <button onClick={() => togglePanel('countries')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
      </div>

      <div style={{ padding: '8px 14px', borderBottom: '1px solid #F1F3F5', flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter countries..."
          style={{ width: '100%', padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 5, fontSize: 12, outline: 'none', background: '#F8F9FA', color: '#0F172A', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map(country => {
          const { score, color, label } = getRisk(country.code)
          const evCount = getEventCount(country.code)
          return (
            <div
              key={country.code}
              onClick={() => { flyTo(country.lat, country.lon, 5); setSelectedCountry(country.name, country.code) }}
              style={{ padding: '9px 16px', borderBottom: '1px solid #F1F3F5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 80ms' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FA')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              {/* Risk score */}
              <div style={{ width: 36, flexShrink: 0, textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 8, color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>{label}</div>
              </div>

              {/* Country */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{country.name}</div>
                <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 1, letterSpacing: '0.04em' }}>{country.code}</div>
              </div>

              {/* Events */}
              {evCount > 0 && (
                <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: '#DC2626' }}>{evCount}</span>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '7px 16px', borderTop: '1px solid #F1F3F5', fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
        {filtered.length} countries
      </div>
    </div>
  )
}
