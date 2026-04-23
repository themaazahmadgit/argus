import { NextRequest, NextResponse } from 'next/server'
import { fetchWikipediaContext } from '@/lib/wikipediaRAG'

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') || ''
  if (!country) return NextResponse.json({ error: 'country required' }, { status: 400 })
  const context = await fetchWikipediaContext(country)
  return NextResponse.json({ country, context, length: context.length })
}
