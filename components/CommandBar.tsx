'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useMapStore } from '@/stores/mapStore'
import { IntelEvent } from '@/types'
import { Search, Globe, AlertCircle, MapPin, Clock } from 'lucide-react'

const QUICK_COUNTRIES = [
  { name: 'Ukraine', code: 'UA', lat: 48.5, lon: 31.0 },
  { name: 'Israel', code: 'IL', lat: 31.5, lon: 34.9 },
  { name: 'Iran', code: 'IR', lat: 32.4, lon: 53.7 },
  { name: 'China', code: 'CN', lat: 35.0, lon: 105.0 },
  { name: 'Russia', code: 'RU', lat: 60.0, lon: 90.0 },
  { name: 'North Korea', code: 'KP', lat: 40.3, lon: 127.5 },
  { name: 'Taiwan', code: 'TW', lat: 23.7, lon: 121.0 },
  { name: 'Sudan', code: 'SD', lat: 15.5, lon: 32.5 },
]

interface SearchResult {
  type: 'country' | 'event' | 'location'
  label: string
  sublabel?: string
  lat?: number
  lon?: number
  code?: string
  event?: IntelEvent
}

export default function CommandBar() {
  const { togglePanel, events, flyTo, setSelectedCountry } = useMapStore()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [geoResults, setGeoResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const eventResults: SearchResult[] = events
    .filter(e => e.title.toLowerCase().includes(query.toLowerCase()) && query.length > 2)
    .slice(0, 5)
    .map(e => ({ type: 'event' as const, label: e.title, sublabel: `${e.country} · ${e.source}`, lat: e.lat, lon: e.lon, event: e }))

  const countryResults: SearchResult[] = query.length > 1
    ? QUICK_COUNTRIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
        .map(c => ({ type: 'country' as const, label: c.name, sublabel: c.code, lat: c.lat, lon: c.lon, code: c.code }))
    : QUICK_COUNTRIES.map(c => ({ type: 'country' as const, label: c.name, sublabel: c.code, lat: c.lat, lon: c.lon, code: c.code }))

  const allResults: SearchResult[] = [...countryResults, ...eventResults, ...geoResults].slice(0, 12)

  useEffect(() => {
    if (query.length < 2) { setGeoResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        const results: SearchResult[] = (data.features || []).slice(0, 3).map((f: Record<string, unknown>) => ({
          type: 'location' as const,
          label: f.text as string,
          sublabel: f.place_name as string,
          lat: (f.center as number[])?.[1],
          lon: (f.center as number[])?.[0],
        }))
        setGeoResults(results)
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = useCallback((result: SearchResult) => {
    if (result.lat && result.lon) flyTo(result.lat, result.lon, result.type === 'country' ? 5 : 7)
    if (result.type === 'country' && result.label && result.code) {
      setSelectedCountry(result.label, result.code)
    }
    if (result.type === 'event' && result.event) {
      useMapStore.getState().setSelectedEvent(result.event)
    }
    togglePanel('commandBar')
  }, [flyTo, setSelectedCountry, togglePanel])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allResults.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && allResults[selected]) handleSelect(allResults[selected])
    if (e.key === 'Escape') togglePanel('commandBar')
  }

  const getIcon = (type: string) => {
    if (type === 'country') return <Globe size={13} />
    if (type === 'event') return <AlertCircle size={13} />
    return <MapPin size={13} />
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
      onClick={() => togglePanel('commandBar')}
    >
      <div style={{ width: '92vw', maxWidth: 560, background: 'white', borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
          <Search size={16} color="#94A3B8" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search countries, events, locations..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0F172A', background: 'transparent' }}
          />
          <kbd style={{ fontSize: 11, color: '#94A3B8', background: '#F1F3F5', padding: '2px 6px', borderRadius: 4 }}>ESC</kbd>
        </div>

        <div>
          {query.length === 0 && (
            <div style={{ padding: '8px 0' }}>
              <div style={{ padding: '4px 16px', fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} /> Quick Access
              </div>
              {allResults.map((r, i) => (
                <ResultItem key={i} result={r} selected={selected === i} onClick={() => handleSelect(r)} icon={getIcon(r.type)} />
              ))}
            </div>
          )}
          {query.length > 0 && (
            <div style={{ padding: '8px 0', maxHeight: 400, overflowY: 'auto' }}>
              {allResults.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No results for "{query}"</div>
              )}
              {allResults.map((r, i) => (
                <ResultItem key={i} result={r} selected={selected === i} onClick={() => handleSelect(r)} icon={getIcon(r.type)} />
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid #F1F3F5', display: 'flex', gap: 12, fontSize: 10, color: '#94A3B8' }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  )
}

function ResultItem({ result, selected, onClick, icon }: { result: SearchResult; selected: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: selected ? '#EFF6FF' : 'transparent', cursor: 'pointer', transition: 'background 100ms' }}
    >
      <span style={{ color: selected ? '#1D4ED8' : '#94A3B8', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: selected ? '#1D4ED8' : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.label}</div>
        {result.sublabel && <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.sublabel}</div>}
      </div>
    </div>
  )
}
