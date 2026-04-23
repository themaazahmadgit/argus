import { NextRequest, NextResponse } from 'next/server'
import { IntelEvent } from '@/types'
import { runCorrelationEngine } from '@/lib/correlationEngine'
import { getCache, setCache } from '@/lib/cache'

export async function POST(req: NextRequest) {
  const cached = getCache('correlations')
  if (cached) return NextResponse.json(cached)

  const { events }: { events: IntelEvent[] } = await req.json()
  const alerts = runCorrelationEngine(events)
  setCache('correlations', alerts, 300)
  return NextResponse.json(alerts)
}

export async function GET() {
  const cached = getCache('correlations')
  if (cached) return NextResponse.json(cached)
  return NextResponse.json([])
}
