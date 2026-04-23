'use client'
import { useState, useRef } from 'react'
import { useMapStore } from '@/stores/mapStore'
import { Search } from 'lucide-react'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ text: string; place_name: string; center: [number, number] }>>([])
  const { flyTo } = useMapStore()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleInput = (v: string) => {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(v)}`)
      const data = await res.json()
      setResults(data.features?.slice(0, 5) || [])
    }, 300)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E2E8F0', borderRadius: 7, padding: '6px 10px', background: '#F8F9FA' }}>
        <Search size={13} color="#94A3B8" />
        <input value={query} onChange={e => handleInput(e.target.value)} placeholder="Search locations..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: '#0F172A', width: 180 }} />
      </div>
      {results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100 }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => { flyTo(r.center[1], r.center[0], 6); setResults([]); setQuery(r.text) }}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: '#0F172A', borderBottom: i < results.length - 1 ? '1px solid #F1F3F5' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FA')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <div style={{ fontWeight: 500 }}>{r.text}</div>
              <div style={{ fontSize: 10, color: '#94A3B8' }}>{r.place_name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
