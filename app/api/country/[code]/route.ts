import { NextRequest, NextResponse } from 'next/server'
import { CountryProfile, IntelEvent } from '@/types'
import { getCache, setCache } from '@/lib/cache'
import { fetchWorldBankData } from '@/lib/worldbank'
import { FREEDOM_SCORES, FRAGILITY_SCORES, SANCTIONED_COUNTRIES, CHOKEPOINTS } from '@/lib/constants'
import { haversineDistance } from '@/lib/haversine'

async function fetchCountryInfo(code: string) {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}`, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const [country] = await res.json()
    return {
      name: country.name.common,
      capital: country.capital?.[0] || 'Unknown',
      region: country.region,
      subregion: country.subregion,
      population: country.population,
      flag: '',
    }
  } catch { return null }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const upper = code.toUpperCase()
  const cacheKey = `country-${upper}`
  const cached = getCache<CountryProfile>(cacheKey)
  if (cached) return NextResponse.json(cached)

  const eventsUrl = new URL('/api/events', req.nextUrl.origin)
  const [countryInfo, wbData, eventsRes] = await Promise.all([
    fetchCountryInfo(upper),
    fetchWorldBankData(upper),
    fetch(eventsUrl.toString(), { signal: AbortSignal.timeout(10000) }).then(r => r.json()).catch(() => []),
  ])

  const allEvents: IntelEvent[] = eventsRes || []
  const recentEvents = allEvents
    .filter(e => e.countryCode === upper || e.country.toLowerCase().includes((countryInfo?.name || upper).toLowerCase()))
    .slice(0, 15)

  const freedomScore = FREEDOM_SCORES[upper] ?? 50
  const fragilityScore = FRAGILITY_SCORES[upper] ?? 40
  const conflictCount = recentEvents.filter(e => e.category === 'conflict').length
  const inflation = wbData.inflation || 0
  const sanctioned = SANCTIONED_COUNTRIES.includes(upper)

  const nearChokepoint = CHOKEPOINTS.some(cp => {
    if (!recentEvents.length) return false
    return recentEvents.some(e => haversineDistance(e.lat, e.lon, cp.lat, cp.lon) < 500)
  })

  let riskScore = 30
  riskScore += (100 - freedomScore) * 0.2
  riskScore += fragilityScore * 0.2
  riskScore += Math.min(20, conflictCount * 3)
  riskScore += inflation > 20 ? 10 : inflation > 10 ? 5 : 0
  riskScore += nearChokepoint ? 5 : 0
  riskScore += sanctioned ? 15 : 0
  riskScore = Math.min(95, Math.round(riskScore))

  const profile: CountryProfile = {
    name: countryInfo?.name || upper,
    code: upper,
    capital: countryInfo?.capital || 'Unknown',
    region: countryInfo?.region || 'Unknown',
    subregion: countryInfo?.subregion || 'Unknown',
    population: countryInfo?.population || 0,
    flag: countryInfo?.flag || '',
    riskScore,
    gdp: wbData.gdp,
    gdpGrowth: wbData.gdpGrowth,
    inflation: wbData.inflation,
    militarySpending: wbData.militarySpending,
    debtToGdp: wbData.debtToGdp,
    freedomScore,
    fragilityScore,
    recentEvents,
    economicHistory: wbData.economicHistory,
  }

  setCache(cacheKey, profile, 3600)
  return NextResponse.json(profile)
}
