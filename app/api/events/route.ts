import { NextResponse } from 'next/server'
import { IntelEvent } from '@/types'
import { getCache, setCache } from '@/lib/cache'
import { fetchGDELTEvents } from '@/lib/gdelt'

const STATIC_FALLBACK: IntelEvent[] = [
  { id: 's1', source: 'usgs', category: 'earthquake', title: '6.2 Magnitude Earthquake — Eastern Turkey', summary: 'USGS reports 6.2 magnitude event near Erzincan, Turkey. Damage reports emerging.', lat: 39.7, lon: 39.5, country: 'Turkey', countryCode: 'TR', severity: 'high', timestamp: new Date(Date.now()-1800000).toISOString(), url: 'https://earthquake.usgs.gov' },
  { id: 's2', source: 'gdacs', category: 'disaster', title: 'Tropical Cyclone Approaching Bangladesh Coast', summary: 'GDACS Red Alert: TC intensifying in Bay of Bengal, landfall projected within 48 hours.', lat: 21.5, lon: 89.0, country: 'Bangladesh', countryCode: 'BD', severity: 'critical', timestamp: new Date(Date.now()-3600000).toISOString(), url: 'https://gdacs.org' },
  { id: 's3', source: 'reliefweb', category: 'humanitarian', title: 'UNHCR: 2.1M Displaced in Sudan Crisis', summary: 'UN refugee agency reports over 2 million displaced as RSF-SAF conflict enters 13th month.', lat: 15.5, lon: 32.5, country: 'Sudan', countryCode: 'SD', severity: 'critical', timestamp: new Date(Date.now()-7200000).toISOString(), url: 'https://reliefweb.int' },
  { id: 's4', source: 'who', category: 'health', title: 'WHO Outbreak Alert: Mpox Cluster in DRC', summary: 'WHO reports new clade Ib mpox cluster detected in eastern Democratic Republic of Congo.', lat: -1.5, lon: 29.0, country: 'DR Congo', countryCode: 'CD', severity: 'high', timestamp: new Date(Date.now()-10800000).toISOString(), url: 'https://who.int' },
  { id: 's5', source: 'ucdp', category: 'conflict', title: 'Ethiopia: Amhara-Federal Forces Clash Near Bahir Dar', summary: 'FANO militia and Ethiopian National Defence Forces exchange fire near regional capital.', lat: 11.6, lon: 37.4, country: 'Ethiopia', countryCode: 'ET', severity: 'high', timestamp: new Date(Date.now()-14400000).toISOString(), url: 'https://ucdp.uu.se', fatalities: 23 },
  { id: 's6', source: 'gdelt', category: 'conflict', title: 'Ukraine: Russian Missile Barrage Targets Power Grid', summary: 'Russian forces launch coordinated missile attack on Ukrainian energy infrastructure across 5 oblasts.', lat: 50.4, lon: 30.5, country: 'Ukraine', countryCode: 'UA', severity: 'critical', timestamp: new Date(Date.now()-18000000).toISOString(), url: 'https://gdeltproject.org', fatalities: 9 },
  { id: 's7', source: 'rss', category: 'political', title: 'North Korea Tests ICBM — Flies Over Japan', summary: 'DPRK ballistic missile overflies Japanese archipelago; Japan issues J-Alert nationwide.', lat: 40.3, lon: 127.5, country: 'North Korea', countryCode: 'KP', severity: 'critical', timestamp: new Date(Date.now()-21600000).toISOString(), url: 'https://www.bbc.com/news' },
  { id: 's8', source: 'gdelt', category: 'conflict', title: 'Gaza: IDF Ground Operations Continue in Rafah', summary: 'Israeli Defence Forces continue offensive in Rafah; humanitarian access severely restricted.', lat: 31.3, lon: 34.2, country: 'Palestine', countryCode: 'PS', severity: 'critical', timestamp: new Date(Date.now()-25200000).toISOString(), url: 'https://gdeltproject.org', fatalities: 67 },
  { id: 's9', source: 'ucdp', category: 'conflict', title: 'Mali: Wagner-Affiliated Forces Attack Timbuktu', summary: 'Armed group linked to Africa Corps conducts operation near Timbuktu; MINUSMA successor mission responds.', lat: 16.8, lon: -3.0, country: 'Mali', countryCode: 'ML', severity: 'high', timestamp: new Date(Date.now()-28800000).toISOString(), url: 'https://ucdp.uu.se', fatalities: 15 },
  { id: 's10', source: 'gdelt', category: 'political', title: 'Iran: Protests Erupt Following Fuel Price Hike', summary: 'Mass demonstrations across Tehran, Isfahan, and Mashhad following 40% fuel subsidy cut.', lat: 35.7, lon: 51.4, country: 'Iran', countryCode: 'IR', severity: 'high', timestamp: new Date(Date.now()-32400000).toISOString(), url: 'https://gdeltproject.org' },
  { id: 's11', source: 'reliefweb', category: 'humanitarian', title: 'Yemen: Famine Conditions in 3 Governorates — WFP', summary: 'WFP declares famine conditions in Hadramawt, Al Jawf, and Marib governorates.', lat: 15.9, lon: 44.2, country: 'Yemen', countryCode: 'YE', severity: 'critical', timestamp: new Date(Date.now()-36000000).toISOString(), url: 'https://reliefweb.int' },
  { id: 's12', source: 'usgs', category: 'earthquake', title: '5.8 Earthquake — Philippines Mindanao', summary: 'USGS records 5.8 magnitude event near Davao, Mindanao island. No tsunami warning issued.', lat: 7.2, lon: 125.4, country: 'Philippines', countryCode: 'PH', severity: 'medium', timestamp: new Date(Date.now()-39600000).toISOString(), url: 'https://earthquake.usgs.gov' },
  { id: 's13', source: 'gdelt', category: 'conflict', title: 'Myanmar: SAC Airstrike on Resistance-Held Town', summary: 'Tatmadaw airstrike on Demoso township, Kayah State. PDF claims 30+ civilian casualties.', lat: 19.3, lon: 97.1, country: 'Myanmar', countryCode: 'MM', severity: 'critical', timestamp: new Date(Date.now()-43200000).toISOString(), url: 'https://gdeltproject.org', fatalities: 31 },
  { id: 's14', source: 'rss', category: 'political', title: 'Venezuela: Maduro Arrests Opposition Candidates', summary: 'Venezuelan authorities arrest three opposition presidential candidates weeks before scheduled elections.', lat: 10.5, lon: -66.9, country: 'Venezuela', countryCode: 'VE', severity: 'high', timestamp: new Date(Date.now()-46800000).toISOString(), url: 'https://www.reuters.com' },
  { id: 's15', source: 'gdelt', category: 'conflict', title: 'Somalia: Al-Shabaab Sieges Beledweyne', summary: 'Al-Shabaab forces encircle Hirshabelle state capital; AMISOM units in defensive posture.', lat: 4.7, lon: 45.2, country: 'Somalia', countryCode: 'SO', severity: 'critical', timestamp: new Date(Date.now()-50400000).toISOString(), url: 'https://gdeltproject.org', fatalities: 22 },
  { id: 's16', source: 'ucdp', category: 'conflict', title: 'Nigeria: Boko Haram Raid on Maiduguri Outskirts', summary: 'ISWAP-affiliated militants attack military checkpoint northeast of Maiduguri, Borno State.', lat: 11.8, lon: 13.2, country: 'Nigeria', countryCode: 'NG', severity: 'high', timestamp: new Date(Date.now()-54000000).toISOString(), url: 'https://ucdp.uu.se', fatalities: 12 },
  { id: 's17', source: 'reliefweb', category: 'humanitarian', title: 'Syria: 14.6M People Need Humanitarian Aid — OCHA', summary: 'OCHA reports humanitarian needs at 14-year high as earthquake recovery compounds conflict displacement.', lat: 36.2, lon: 37.2, country: 'Syria', countryCode: 'SY', severity: 'critical', timestamp: new Date(Date.now()-57600000).toISOString(), url: 'https://reliefweb.int' },
  { id: 's18', source: 'gdelt', category: 'economic', title: 'Russia: SWIFT Exclusion Triggers Ruble Selloff', summary: 'Ruble falls 4.2% on expanded Western sanctions targeting energy sector intermediaries.', lat: 55.7, lon: 37.6, country: 'Russia', countryCode: 'RU', severity: 'medium', timestamp: new Date(Date.now()-61200000).toISOString(), url: 'https://gdeltproject.org' },
  { id: 's19', source: 'who', category: 'health', title: 'WHO: Cholera Outbreak Spreading Across 14 Countries', summary: 'Global cholera cases up 200% vs 5-year average; Yemen, Syria, Ethiopia most affected.', lat: 0, lon: 40, country: 'Global', countryCode: 'XX', severity: 'high', timestamp: new Date(Date.now()-64800000).toISOString(), url: 'https://who.int' },
  { id: 's20', source: 'rss', category: 'political', title: 'Pakistan: Military Coup Rumors Rattle Islamabad', summary: 'Political tensions spike as army chief meets prime minister amid PTI protests; markets fall 3%.', lat: 33.7, lon: 73.1, country: 'Pakistan', countryCode: 'PK', severity: 'high', timestamp: new Date(Date.now()-68400000).toISOString(), url: 'https://www.dawn.com' },
  { id: 's21', source: 'firms', category: 'wildfire', title: 'Canada: Massive Wildfire Complex in Alberta', summary: 'VIIRS satellite detects 847 active fire hotspots across 2.3M hectares in Alberta.', lat: 56.7, lon: -117.3, country: 'Canada', countryCode: 'CA', severity: 'high', timestamp: new Date(Date.now()-72000000).toISOString(), url: 'https://firms.modaps.eosdis.nasa.gov' },
  { id: 's22', source: 'gdelt', category: 'conflict', title: 'Taiwan Strait: PLA Navy Conducts Carrier Strike Group Exercise', summary: 'Shandong carrier strike group maneuvers through Taiwan Strait median line in coordinated drill.', lat: 24.0, lon: 119.5, country: 'China', countryCode: 'CN', severity: 'high', timestamp: new Date(Date.now()-75600000).toISOString(), url: 'https://gdeltproject.org' },
  { id: 's23', source: 'ucdp', category: 'conflict', title: 'Colombia: FARC Dissident Attack on Pipeline', summary: 'Segunda Marquetalia attacks Caño Limón-Coveñas pipeline in Arauca, disrupting 78,000 bbl/day.', lat: 6.5, lon: -71.3, country: 'Colombia', countryCode: 'CO', severity: 'high', timestamp: new Date(Date.now()-79200000).toISOString(), url: 'https://ucdp.uu.se' },
  { id: 's24', source: 'gdelt', category: 'political', title: 'Belarus: Lukashenko Extends Emergency Powers', summary: 'Belarus extends state of emergency for third consecutive year; opposition in exile condemns decree.', lat: 53.9, lon: 27.6, country: 'Belarus', countryCode: 'BY', severity: 'medium', timestamp: new Date(Date.now()-82800000).toISOString(), url: 'https://gdeltproject.org' },
  { id: 's25', source: 'reliefweb', category: 'humanitarian', title: 'Afghanistan: 23M Face Food Insecurity — WFP', summary: 'WFP emergency report: over half of Afghanistan population faces acute food insecurity under Taliban rule.', lat: 33.9, lon: 67.7, country: 'Afghanistan', countryCode: 'AF', severity: 'critical', timestamp: new Date(Date.now()-86400000).toISOString(), url: 'https://reliefweb.int' },
]

async function fetchUSGSEarthquakes(): Promise<IntelEvent[]> {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return data.features.slice(0, 30).map((f: Record<string, unknown>) => {
      const p = f.properties as Record<string, unknown>
      const geo = f.geometry as { coordinates: number[] }
      const mag = p.mag as number
      return {
        id: `usgs-${f.id}`,
        source: 'usgs' as const,
        category: 'earthquake' as const,
        title: `M${mag.toFixed(1)} Earthquake — ${p.place}`,
        summary: `USGS reports ${mag.toFixed(1)} magnitude earthquake near ${p.place}.`,
        lat: geo.coordinates[1],
        lon: geo.coordinates[0],
        country: extractCountryFromPlace(String(p.place || '')),
        countryCode: 'XX',
        severity: mag >= 6 ? 'critical' : mag >= 5 ? 'high' : mag >= 4 ? 'medium' : 'low' as IntelEvent['severity'],
        timestamp: new Date(p.time as number).toISOString(),
        url: String(p.url || 'https://earthquake.usgs.gov'),
      }
    })
  } catch { return [] }
}

async function fetchGDACS(): Promise<IntelEvent[]> {
  try {
    const res = await fetch('https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=Green;Orange;Red&eventlist=EQ;TC;FL;VO;DR;WF', { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    const features = data.features || []
    return features.slice(0, 20).map((f: Record<string, unknown>, i: number) => {
      const p = f.properties as Record<string, unknown>
      const geo = f.geometry as { coordinates: number[] }
      const alertlevel = String(p.alertlevel || 'Green')
      return {
        id: `gdacs-${i}-${Date.now()}`,
        source: 'gdacs' as const,
        category: 'disaster' as const,
        title: String(p.name || p.eventtype || 'Disaster Event'),
        summary: String(p.description || `GDACS ${alertlevel} alert issued.`),
        lat: geo?.coordinates?.[1] || 0,
        lon: geo?.coordinates?.[0] || 0,
        country: String(p.country || 'Unknown'),
        countryCode: String(p.iso3 || 'XX').slice(0, 2),
        severity: alertlevel === 'Red' ? 'critical' : alertlevel === 'Orange' ? 'high' : 'medium' as IntelEvent['severity'],
        timestamp: new Date(String(p.fromdate || Date.now())).toISOString(),
        url: String(p.url || 'https://gdacs.org'),
      }
    })
  } catch { return [] }
}

async function fetchReliefWeb(): Promise<IntelEvent[]> {
  try {
    const url = 'https://api.reliefweb.int/v1/reports?appname=argus&limit=20&fields[include][]=title&fields[include][]=url&fields[include][]=date.created&fields[include][]=country&fields[include][]=primary_country.location'
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).slice(0, 15).map((item: Record<string, unknown>, i: number) => {
      const f = item.fields as Record<string, unknown>
      const countries = f.country as Array<Record<string, string>> || []
      const location = (f['primary_country.location'] || { lat: 0, lon: 0 }) as { lat: number; lon: number }
      const country = countries[0]
      return {
        id: `reliefweb-${i}-${Date.now()}`,
        source: 'reliefweb' as const,
        category: 'humanitarian' as const,
        title: String(f.title || 'Humanitarian Report'),
        summary: `ReliefWeb report: ${f.title}`,
        lat: location.lat || (Math.random() * 80 - 40),
        lon: location.lon || (Math.random() * 360 - 180),
        country: country?.name || 'Unknown',
        countryCode: country?.iso3?.slice(0, 2) || 'XX',
        severity: 'medium' as const,
        timestamp: String((f.date as Record<string, string>)?.created || new Date().toISOString()),
        url: String(f.url || 'https://reliefweb.int'),
      }
    })
  } catch { return [] }
}

async function fetchUCDP(): Promise<IntelEvent[]> {
  try {
    const res = await fetch('https://ucdpapi.pcr.uu.se/api/gedevents/24.1?pagesize=50', { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.Result || []).slice(0, 30).map((e: Record<string, unknown>, i: number) => {
      const type = Number(e.type_of_violence)
      return {
        id: `ucdp-${i}-${Date.now()}`,
        source: 'ucdp' as const,
        category: 'conflict' as const,
        title: `${e.dyad_name || 'Armed Conflict'} — ${e.country}`,
        summary: `UCDP records armed conflict between ${e.side_a} and ${e.side_b}. Estimated fatalities: ${e.best || 0}.`,
        lat: Number(e.latitude) || 0,
        lon: Number(e.longitude) || 0,
        country: String(e.country || 'Unknown'),
        countryCode: 'XX',
        severity: type === 1 ? 'critical' : type === 3 ? 'critical' : 'high' as IntelEvent['severity'],
        timestamp: String(e.date_start || new Date().toISOString()),
        url: 'https://ucdp.uu.se',
        fatalities: Number(e.best) || 0,
      }
    }).filter((e: IntelEvent) => e.lat !== 0 && e.lon !== 0)
  } catch { return [] }
}

function deduplicateEvents(events: IntelEvent[]): IntelEvent[] {
  const result: IntelEvent[] = []
  for (const event of events) {
    const isDupe = result.some(existing => {
      const timeDiff = Math.abs(new Date(event.timestamp).getTime() - new Date(existing.timestamp).getTime())
      if (timeDiff > 86400000) return false
      const dist = Math.sqrt((event.lat - existing.lat) ** 2 + (event.lon - existing.lon) ** 2)
      if (dist > 1) return false
      return wordOverlap(event.title, existing.title) > 0.5
    })
    if (!isDupe) result.push(event)
  }
  return result
}

function wordOverlap(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  const setB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  if (setA.size === 0 || setB.size === 0) return 0
  const intersection = Array.from(setA).filter(w => setB.has(w)).length
  return intersection / Math.min(setA.size, setB.size)
}

function extractCountryFromPlace(place: string): string {
  const parts = place.split(',')
  return parts[parts.length - 1]?.trim() || 'Unknown'
}

export async function GET() {
  const cached = getCache<IntelEvent[]>('all-events')
  if (cached) return NextResponse.json(cached)

  const [gdeltEvents, usgsEvents, gdacsEvents, reliefwebEvents, ucdpEvents] = await Promise.all([
    fetchGDELTEvents(),
    fetchUSGSEarthquakes(),
    fetchGDACS(),
    fetchReliefWeb(),
    fetchUCDP(),
  ])

  let all = [...STATIC_FALLBACK, ...gdeltEvents, ...usgsEvents, ...gdacsEvents, ...reliefwebEvents, ...ucdpEvents]
  all = deduplicateEvents(all)
  all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  setCache('all-events', all, 300)
  return NextResponse.json(all)
}
