import { NextResponse } from 'next/server'
import { getCache } from '@/lib/cache'
import { IntelEvent, AircraftPosition, VesselPosition, Commodity } from '@/types'

type SourceStatus = { cached: boolean; count: number; age_seconds: number | null }

function checkSource<T extends object>(key: string): SourceStatus {
  const entry = getCache<T[]>(key)
  if (!entry) return { cached: false, count: 0, age_seconds: null }
  return { cached: true, count: entry.length, age_seconds: 0 }
}

export async function GET() {
  const events = getCache<IntelEvent[]>('all-events')
  const gdelt = getCache<IntelEvent[]>('gdelt-events')
  const aircraft = getCache<AircraftPosition[]>('aviation')
  const vessels = getCache<VesselPosition[]>('vessels')
  const commodities = getCache<Commodity[]>('commodities')

  const sources = {
    events: { cached: !!events, count: events?.length ?? 0 },
    gdelt: { cached: !!gdelt, count: gdelt?.length ?? 0 },
    aviation: { cached: !!aircraft, count: aircraft?.length ?? 0 },
    vessels: { cached: !!vessels, count: vessels?.length ?? 0 },
    commodities: { cached: !!commodities, count: commodities?.length ?? 0 },
  }

  const totalEvents = events?.length ?? 0
  const sourceCounts: Record<string, number> = {}
  if (events) {
    for (const e of events) {
      sourceCounts[e.source] = (sourceCounts[e.source] ?? 0) + 1
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    total_events: totalEvents,
    source_breakdown: sourceCounts,
    cache: sources,
    env: {
      mapbox: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      openai: !!process.env.OPENAI_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      nasa_firms: !!process.env.NASA_FIRMS_KEY,
      acled: !!process.env.ACLED_EMAIL,
    },
  })
}
