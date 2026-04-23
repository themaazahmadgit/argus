'use client'
import { useQuery } from '@tanstack/react-query'
import { useMapStore } from '@/stores/mapStore'
import { useAuth } from '@/lib/auth/AuthContext'
import { Commodity } from '@/types'
import { useState, useRef, useEffect } from 'react'

export default function Header() {
  const { panels, togglePanel, selectedCountry, events, alerts } = useMapStore()
  const { user, isAuthenticated, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: commodities } = useQuery<Commodity[]>({
    queryKey: ['commodities'],
    queryFn: () => fetch('/api/commodities').then(r => r.json()),
    refetchInterval: 120000,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length

  const btn = (active: boolean, critical?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 9px',
    border: '1px solid transparent', borderRadius: 5, cursor: 'pointer',
    fontSize: 11, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap',
    transition: 'all 80ms', flexShrink: 0,
    background: critical && criticalAlerts > 0 ? '#FEF2F2' : active ? '#F1F5F9' : 'transparent',
    color: critical && criticalAlerts > 0 ? '#DC2626' : active ? '#0F172A' : '#64748B',
    borderColor: critical && criticalAlerts > 0 ? '#FECACA' : active ? '#E2E8F0' : 'transparent',
  })

  const Badge = ({ n, red }: { n: number; red?: boolean }) => (
    <span className="font-mono" style={{
      fontSize: 9, fontWeight: 700, minWidth: 15, height: 15, borderRadius: 8,
      background: red && criticalAlerts > 0 ? '#DC2626' : '#1D4ED8',
      color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
    }}>{n}</span>
  )

  const Divider = () => <div style={{ width: 1, height: 16, background: '#E2E8F0', flexShrink: 0 }} />

  return (
    <header style={{
      background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', height: 48,
      display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
      zIndex: 100, flexShrink: 0, minWidth: 0,
    }}>
      {/* Logo — always visible */}
      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1 }}>ARGUS</div>
        <div style={{ fontSize: 7, color: '#94A3B8', letterSpacing: '0.12em', lineHeight: 1, marginTop: 2, textTransform: 'uppercase' }}>Weiss &amp; Hirsch</div>
      </div>

      <Divider />

      {/* Commodity Ticker — scrollable, hides on small screens */}
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <div style={{
          display: 'flex', gap: 16, overflowX: 'auto', alignItems: 'center',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        } as React.CSSProperties}>
          {(commodities || []).map(c => (
            <div key={c.symbol} style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{c.name}</span>
              <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>
                {c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="font-mono" style={{
                fontSize: 9, fontWeight: 700,
                color: c.trend === 'up' ? '#16A34A' : c.trend === 'down' ? '#DC2626' : '#94A3B8',
              }}>
                {c.changePercent > 0 ? '+' : ''}{c.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
          {!commodities && (
            <div style={{ display: 'flex', gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ width: 100, height: 12, borderRadius: 3 }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* Nav — scrollable row so it never clips */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0,
        overflowX: 'auto', scrollbarWidth: 'none',
      } as React.CSSProperties}>
        <button style={btn(false)} onClick={() => togglePanel('commandBar')} title="Search (⌘K)">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Search
        </button>

        <button style={btn(panels.eventFeed)} onClick={() => togglePanel('eventFeed')}>
          Events <Badge n={events.length} />
        </button>

        <button style={btn(panels.alerts, true)} onClick={() => togglePanel('alerts')}>
          Alerts {alerts.length > 0 && <Badge n={alerts.length} red />}
        </button>

        <button style={btn(panels.situations)} onClick={() => togglePanel('situations')}>
          Situations
        </button>

        <button style={btn(panels.countries)} onClick={() => togglePanel('countries')}>
          Countries
        </button>

        <button style={btn(panels.commodities)} onClick={() => togglePanel('commodities')}>
          Markets
        </button>

        <button style={btn(panels.compare)} onClick={() => togglePanel('compare')}>
          Compare
        </button>

        {selectedCountry && (
          <>
            <Divider />
            <button
              onClick={() => togglePanel('brief')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#0F172A', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600, flexShrink: 0 }}
            >
              Brief
              <span style={{ fontSize: 9, opacity: 0.55, fontWeight: 400 }}>{selectedCountry}</span>
            </button>
          </>
        )}

        <Divider />

        {isAuthenticated ? (
          <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{ width: 26, height: 26, borderRadius: '50%', background: '#0F172A', color: 'white', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {user?.email?.slice(0, 2).toUpperCase()}
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', right: 0, top: 32, background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, minWidth: 190, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 200 }}>
                <div style={{ padding: '4px 8px 8px', borderBottom: '1px solid #F1F3F5', marginBottom: 4 }}>
                  <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Analyst</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{user?.email}</div>
                </div>
                <button onClick={() => { signOut(); setShowUserMenu(false) }} style={{ display: 'flex', width: '100%', padding: '5px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#475569', borderRadius: 4, textAlign: 'left' }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => togglePanel('authModal')}
            style={{ padding: '5px 10px', background: 'transparent', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 500, flexShrink: 0 }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}
