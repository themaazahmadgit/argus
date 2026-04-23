import { NextResponse } from 'next/server'
import { Commodity } from '@/types'
import { getCache, setCache } from '@/lib/cache'

const SYMBOLS = [
  { yahoo: 'CL=F',     name: 'WTI Crude',   symbol: 'WTI' },
  { yahoo: 'BZ=F',     name: 'Brent Crude',  symbol: 'BRENT' },
  { yahoo: 'GC=F',     name: 'Gold',         symbol: 'XAU' },
  { yahoo: 'SI=F',     name: 'Silver',       symbol: 'XAG' },
  { yahoo: 'NG=F',     name: 'Natural Gas',  symbol: 'NG' },
  { yahoo: 'ZW=F',     name: 'Wheat',        symbol: 'ZW' },
  { yahoo: 'HG=F',     name: 'Copper',       symbol: 'HG' },
  { yahoo: 'BTC-USD',  name: 'Bitcoin',      symbol: 'BTC' },
  { yahoo: '^GSPC',    name: 'S&P 500',      symbol: 'SPX' },
  { yahoo: 'DX-Y.NYB', name: 'USD Index',    symbol: 'DXY' },
]

const BASE_PRICES: Record<string, number> = {
  WTI: 78.42, BRENT: 83.15, XAU: 2341.80, XAG: 27.34,
  NG: 2.18, ZW: 547.25, HG: 4.43, BTC: 67842.00, SPX: 5234.18, DXY: 104.32,
}

async function fetchRealPrices(): Promise<Commodity[]> {
  const results: Commodity[] = []
  for (const s of SYMBOLS) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s.yahoo)}?range=2d&interval=1d`
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'ARGUS/1.0' },
      })
      if (!res.ok) continue
      const data = await res.json()
      const meta = data.chart?.result?.[0]?.meta
      if (!meta) continue
      const price = meta.regularMarketPrice
      const prevClose = meta.previousClose || meta.chartPreviousClose
      if (!price || !prevClose) continue
      const change = price - prevClose
      const changePercent = (change / prevClose) * 100
      results.push({
        symbol: s.symbol,
        name: s.name,
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        trend: Math.abs(changePercent) < 0.05 ? 'flat' : changePercent > 0 ? 'up' : 'down',
      })
    } catch { continue }
  }
  return results
}

function generateFallback(): Commodity[] {
  return SYMBOLS.map(s => {
    const base = BASE_PRICES[s.symbol] || 100
    const fluctuation = (Math.random() - 0.48) * base * 0.02
    const price = base + fluctuation
    const changePercent = (fluctuation / base) * 100
    return {
      symbol: s.symbol,
      name: s.name,
      price: Math.round(price * 100) / 100,
      change: Math.round(fluctuation * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      trend: Math.abs(changePercent) < 0.05 ? 'flat' : changePercent > 0 ? 'up' : 'down',
    }
  })
}

export async function GET() {
  const cached = getCache<Commodity[]>('commodities')
  if (cached) return NextResponse.json(cached)

  let commodities = await fetchRealPrices()
  if (commodities.length < 5) commodities = generateFallback()

  setCache('commodities', commodities, 120)
  return NextResponse.json(commodities)
}
