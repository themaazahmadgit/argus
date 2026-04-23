import { NextResponse } from 'next/server'
import { PRIORITY_COUNTRIES } from '@/lib/constants'
import { getCache } from '@/lib/cache'

export async function GET() {
  const cached = PRIORITY_COUNTRIES.filter(c => getCache(`wiki-${c}`) !== null)
  return NextResponse.json({ total: PRIORITY_COUNTRIES.length, cached: cached.length, countries: cached })
}
