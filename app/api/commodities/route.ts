import { NextResponse } from 'next/server'
import { Commodity } from '@/types'
import { getCache, setCache } from '@/lib/cache'

const BASE_PRICES: Record<string, { name: string; price: number; symbol: string }> = {
  WTI: { name: 'WTI Crude', price: 78.42, symbol: 'WTI' },
  BRENT: { name: 'Brent Crude', price: 83.15, symbol: 'BRENT' },
  GOLD: { name: 'Gold', price: 2341.80, symbol: 'XAU' },
  SILVER: { name: 'Silver', price: 27.34, symbol: 'XAG' },
  NATGAS: { name: 'Natural Gas', price: 2.18, symbol: 'NG' },
  WHEAT: { name: 'Wheat', price: 547.25, symbol: 'ZW' },
  COPPER: { name: 'Copper', price: 4.43, symbol: 'HG' },
  BTC: { name: 'Bitcoin', price: 67842.00, symbol: 'BTC' },
  SPX: { name: 'S&P 500', price: 5234.18, symbol: 'SPX' },
  DXY: { name: 'USD Index', price: 104.32, symbol: 'DXY' },
}

function generatePrice(base: number): { price: number; change: number; changePercent: number; trend: 'up' | 'down' | 'flat' } {
  const fluctuation = (Math.random() - 0.48) * base * 0.02
  const price = base + fluctuation
  const change = fluctuation
  const changePercent = (fluctuation / base) * 100
  return {
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    trend: Math.abs(changePercent) < 0.05 ? 'flat' : changePercent > 0 ? 'up' : 'down',
  }
}

export async function GET() {
  const cached = getCache<Commodity[]>('commodities')
  if (cached) return NextResponse.json(cached)

  const commodities: Commodity[] = Object.entries(BASE_PRICES).map(([, v]) => ({
    symbol: v.symbol,
    name: v.name,
    ...generatePrice(v.price),
  }))

  setCache('commodities', commodities, 120)
  return NextResponse.json(commodities)
}
