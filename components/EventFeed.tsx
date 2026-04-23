'use client'
import { useState } from 'react'
import { useMapStore } from '@/stores/mapStore'
import { IntelEvent } from '@/types'
import { SEVERITY_COLORS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'

const CATEGORIES = ['all', 'conflict', 'political', 'disaster', 'health', 'humanitarian', 'environmental']

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All', conflict: 'Conflict', political: 'Political', disaster: 'Disaster',
  health: 'Health', humanitarian: 'Humanitarian', environmental: 'Environmental',
}

export default function EventFeed() {
  const { events, eventFilter, setEventFilter, flyTo, setSelectedEvent, alerts } = useMapStore()
  const uniqueSources = new Set(events.map(e => e.source)).size

  const filtered = events.filter(e => eventFilter === 'all' || e.category === eventFilter)

  return (
    <div className="panel-left">
      {/* Header */}
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Intelligence Feed</span>
          <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8' }}>{filtered.length}</span>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E2E8F0', marginLeft: -16, marginRight: -16, paddingLeft: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setEventFilter(cat)}
              style={{
                padding: '6px 10px 7px', fontSize: 11, fontWeight: eventFilter === cat ? 600 : 400,
                cursor: 'pointer', border: 'none', background: 'transparent', whiteSpace: 'nowrap',
                color: eventFilter === cat ? '#0F172A' : '#94A3B8',
                borderBottom: eventFilter === cat ? '2px solid #1D4ED8' : '2px solid transparent',
                marginBottom: -1, transition: 'all 100ms',
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
            No events in this category
          </div>
        )}
        {filtered.map(event => (
          <EventCard key={event.id} event={event} onClick={() => { flyTo(event.lat, event.lon, 6); setSelectedEvent(event) }} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '7px 16px', borderTop: '1px solid #F1F3F5', fontSize: 10, color: '#94A3B8', flexShrink: 0, display: 'flex', justifyContent: 'space-between' }}>
        <span>{events.length} events · {uniqueSources} sources</span>
        <span>{alerts.length} correlation alerts</span>
      </div>
    </div>
  )
}

function EventCard({ event, onClick }: { event: IntelEvent; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const severityColor = SEVERITY_COLORS[event.severity]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', padding: '11px 16px 11px 0', borderBottom: '1px solid #F1F3F5',
        cursor: 'pointer', background: hovered ? '#FAFAFA' : 'white', transition: 'background 80ms', position: 'relative',
      }}
    >
      {/* Severity bar */}
      <div style={{ width: 3, background: severityColor, flexShrink: 0, marginRight: 12, opacity: 0.8 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <div style={{
          fontSize: 12, fontWeight: 500, color: '#0F172A', lineHeight: 1.45, marginBottom: 5,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {event.title}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Source */}
          <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {event.source}
          </span>
          <span style={{ color: '#CBD5E1', fontSize: 10 }}>·</span>
          {/* Category */}
          <span style={{ fontSize: 9, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {event.category}
          </span>
          {event.fatalities ? (
            <>
              <span style={{ color: '#CBD5E1', fontSize: 10 }}>·</span>
              <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, color: '#DC2626' }}>
                {event.fatalities} KIA
              </span>
            </>
          ) : null}
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>{event.country}</span>
          <span style={{ fontSize: 10, color: '#94A3B8' }}>
            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  )
}
