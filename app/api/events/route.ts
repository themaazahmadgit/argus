import { NextResponse } from 'next/server'
import { IntelEvent } from '@/types'
import { getCache, setCache } from '@/lib/cache'
import { fetchGDELTEvents } from '@/lib/gdelt'
import { haversineDistance } from '@/lib/haversine'

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

// ── WHO Disease Outbreaks ────────────────────────────────────────────────────
async function fetchWHO(): Promise<IntelEvent[]> {
  try {
    const res = await fetch('https://www.who.int/feeds/entity/don/en/rss.xml', { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const text = await res.text()
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.slice(0, 15).map((item, i) => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || 'WHO Alert'
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || 'https://who.int'
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString()
      const geo = inferGeoFromTitleWHO(title)
      return {
        id: `who-${i}-${Date.now()}`,
        source: 'who' as const,
        category: 'health' as const,
        title: title.slice(0, 120),
        summary: `WHO Disease Outbreak Notice: ${title}`,
        lat: geo.lat,
        lon: geo.lon,
        country: geo.country,
        countryCode: geo.countryCode,
        severity: 'high' as const,
        timestamp: new Date(pubDate).toISOString(),
        url: link,
      }
    }).filter(e => e.lat !== 0 && e.lon !== 0)
  } catch { return [] }
}

// ── NASA FIRMS Wildfires ─────────────────────────────────────────────────────
async function fetchNASAFIRMS(): Promise<IntelEvent[]> {
  const key = process.env.NASA_FIRMS_KEY
  if (!key) return []
  try {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_SNPP_NRT/world/1`
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return []
    const text = await res.text()
    const lines = text.split('\n').slice(1).filter(Boolean)

    // Parse CSV rows
    const fires: { lat: number; lon: number; brightness: number; confidence: number; date: string }[] = []
    for (const line of lines) {
      const parts = line.split(',')
      const lat = parseFloat(parts[0])
      const lon = parseFloat(parts[1])
      const brightness = parseFloat(parts[2])
      const confidence = parseInt(parts[8] || '0', 10)
      const date = parts[5] || new Date().toISOString().slice(0, 10)
      if (isNaN(lat) || isNaN(lon) || confidence < 80) continue
      fires.push({ lat, lon, brightness, confidence, date })
    }

    // Cluster fires within 50km
    const clusters: typeof fires[] = []
    const used = new Set<number>()
    for (let i = 0; i < fires.length; i++) {
      if (used.has(i)) continue
      const cluster = [fires[i]]
      used.add(i)
      for (let j = i + 1; j < fires.length; j++) {
        if (used.has(j)) continue
        if (haversineDistance(fires[i].lat, fires[i].lon, fires[j].lat, fires[j].lon) < 50) {
          cluster.push(fires[j])
          used.add(j)
        }
      }
      clusters.push(cluster)
    }

    return clusters.slice(0, 20).map((cluster, i) => {
      const center = cluster[0]
      const maxBright = Math.max(...cluster.map(f => f.brightness))
      const geo = inferGeoFromTitleWHO(`fire at ${center.lat},${center.lon}`)
      const sev: IntelEvent['severity'] = maxBright > 400 ? 'critical' : maxBright > 350 ? 'high' : 'medium'
      return {
        id: `firms-${i}-${Date.now()}`,
        source: 'firms' as const,
        category: 'wildfire' as const,
        title: `Wildfire Cluster — ${cluster.length} hotspots (${center.lat.toFixed(1)}°, ${center.lon.toFixed(1)}°)`,
        summary: `NASA VIIRS detects ${cluster.length} active fire hotspots. Max brightness: ${maxBright.toFixed(0)}K. Confidence: high.`,
        lat: center.lat,
        lon: center.lon,
        country: geo.country,
        countryCode: geo.countryCode,
        severity: sev,
        timestamp: new Date(center.date).toISOString(),
        url: 'https://firms.modaps.eosdis.nasa.gov',
      }
    })
  } catch { return [] }
}

// ── RSS News Aggregator ──────────────────────────────────────────────────────
const RSS_FEEDS = [
  'https://www.aljazeera.com/xml/rss/all.xml',
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'https://www.france24.com/en/rss',
  'https://www.dw.com/rss/en/all/rss-en-all',
  'https://www.middleeasteye.net/rss',
  'https://www.crisisgroup.org/feed',
  'https://www.dawn.com/feeds/home',
  'https://www.rt.com/rss/news/',
  'http://feeds.reuters.com/Reuters/worldNews',
]

const CRISIS_KEYWORDS = /kill|dead|attack|bomb|missile|war|strike|clash|military|troops|rebel|coup|protest|tension|sanction|crisis|explosion|hostage|terror|invasion|ceasefire|drone|nuclear|siege/i

async function fetchRSSFeeds(): Promise<IntelEvent[]> {
  try {
    const results = await Promise.allSettled(
      RSS_FEEDS.map(feed =>
        fetch(feed, { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'ARGUS/1.0' } })
          .then(r => r.ok ? r.text() : Promise.reject())
      )
    )
    const events: IntelEvent[] = []
    results.forEach((result, feedIdx) => {
      if (result.status !== 'fulfilled') return
      const text = result.value
      const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
      items.slice(0, 10).forEach((item, i) => {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || ''
        if (!title || !CRISIS_KEYWORDS.test(title)) return
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString()
        const geo = inferGeoFromTitleWHO(title)
        if (geo.lat === 0 && geo.lon === 0) return
        events.push({
          id: `rss-${feedIdx}-${i}-${Date.now()}`,
          source: 'rss' as const,
          category: inferCategoryRSS(title),
          title: title.slice(0, 120),
          summary: `News intelligence: ${title}`,
          lat: geo.lat,
          lon: geo.lon,
          country: geo.country,
          countryCode: geo.countryCode,
          severity: inferSeverityRSS(title),
          timestamp: new Date(pubDate).toISOString(),
          url: link,
        })
      })
    })
    return events
  } catch { return [] }
}

// ── ACLED (conditional) ──────────────────────────────────────────────────────
async function fetchACLED(): Promise<IntelEvent[]> {
  const email = process.env.ACLED_EMAIL
  const key = process.env.ACLED_PASSWORD
  if (!email || !key) return []
  try {
    const url = `https://api.acleddata.com/acled/read?key=${key}&email=${email}&limit=100`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const data = await res.json()
    const ACLED_SEVERITY: Record<string, IntelEvent['severity']> = {
      'Battles': 'critical',
      'Violence against civilians': 'critical',
      'Explosions/Remote violence': 'high',
      'Riots': 'high',
      'Protests': 'medium',
      'Strategic developments': 'low',
    }
    return (data.data || []).slice(0, 50).map((e: Record<string, unknown>, i: number) => ({
      id: `acled-${i}-${Date.now()}`,
      source: 'acled' as const,
      category: 'conflict' as const,
      title: `${e.event_type} — ${e.country}: ${e.actor1}`,
      summary: String(e.notes || `ACLED records ${e.event_type} event in ${e.country}.`).slice(0, 200),
      lat: Number(e.latitude) || 0,
      lon: Number(e.longitude) || 0,
      country: String(e.country || 'Unknown'),
      countryCode: 'XX',
      severity: ACLED_SEVERITY[String(e.event_type)] || 'medium',
      timestamp: new Date(String(e.event_date)).toISOString(),
      url: 'https://acleddata.com',
      fatalities: Number(e.fatalities) || 0,
    })).filter((e: IntelEvent) => e.lat !== 0 && e.lon !== 0)
  } catch { return [] }
}

// ── Shared geo inference (reuses COUNTRY_GEO logic from gdelt.ts) ────────────
const GEO_MAP: Record<string, { country: string; countryCode: string; lat: number; lon: number }> = {
  ukraine: { country: 'Ukraine', countryCode: 'UA', lat: 48.5, lon: 31.0 },
  russia: { country: 'Russia', countryCode: 'RU', lat: 60.0, lon: 90.0 },
  israel: { country: 'Israel', countryCode: 'IL', lat: 31.5, lon: 34.9 },
  gaza: { country: 'Palestine', countryCode: 'PS', lat: 31.4, lon: 34.3 },
  palestine: { country: 'Palestine', countryCode: 'PS', lat: 31.9, lon: 35.2 },
  iran: { country: 'Iran', countryCode: 'IR', lat: 32.4, lon: 53.7 },
  china: { country: 'China', countryCode: 'CN', lat: 35.0, lon: 105.0 },
  taiwan: { country: 'Taiwan', countryCode: 'TW', lat: 23.7, lon: 121.0 },
  myanmar: { country: 'Myanmar', countryCode: 'MM', lat: 17.0, lon: 96.0 },
  sudan: { country: 'Sudan', countryCode: 'SD', lat: 15.5, lon: 32.5 },
  ethiopia: { country: 'Ethiopia', countryCode: 'ET', lat: 9.1, lon: 40.5 },
  somalia: { country: 'Somalia', countryCode: 'SO', lat: 5.0, lon: 45.0 },
  yemen: { country: 'Yemen', countryCode: 'YE', lat: 15.5, lon: 48.5 },
  syria: { country: 'Syria', countryCode: 'SY', lat: 35.0, lon: 38.0 },
  iraq: { country: 'Iraq', countryCode: 'IQ', lat: 33.2, lon: 43.7 },
  lebanon: { country: 'Lebanon', countryCode: 'LB', lat: 33.9, lon: 35.9 },
  pakistan: { country: 'Pakistan', countryCode: 'PK', lat: 30.0, lon: 70.0 },
  afghanistan: { country: 'Afghanistan', countryCode: 'AF', lat: 33.9, lon: 67.7 },
  nigeria: { country: 'Nigeria', countryCode: 'NG', lat: 9.1, lon: 8.7 },
  mali: { country: 'Mali', countryCode: 'ML', lat: 17.6, lon: -4.0 },
  venezuela: { country: 'Venezuela', countryCode: 'VE', lat: 6.4, lon: -66.6 },
  colombia: { country: 'Colombia', countryCode: 'CO', lat: 4.6, lon: -74.1 },
  mexico: { country: 'Mexico', countryCode: 'MX', lat: 23.6, lon: -102.6 },
  'north korea': { country: 'North Korea', countryCode: 'KP', lat: 40.3, lon: 127.5 },
  india: { country: 'India', countryCode: 'IN', lat: 20.6, lon: 78.9 },
  turkey: { country: 'Turkey', countryCode: 'TR', lat: 38.9, lon: 35.2 },
  egypt: { country: 'Egypt', countryCode: 'EG', lat: 26.8, lon: 30.8 },
  libya: { country: 'Libya', countryCode: 'LY', lat: 26.3, lon: 17.2 },
  congo: { country: 'DR Congo', countryCode: 'CD', lat: -4.0, lon: 21.8 },
  haiti: { country: 'Haiti', countryCode: 'HT', lat: 18.9, lon: -72.3 },
  'saudi arabia': { country: 'Saudi Arabia', countryCode: 'SA', lat: 24.7, lon: 46.7 },
  'south sudan': { country: 'South Sudan', countryCode: 'SS', lat: 6.9, lon: 31.3 },
  chad: { country: 'Chad', countryCode: 'TD', lat: 15.5, lon: 18.7 },
  kenya: { country: 'Kenya', countryCode: 'KE', lat: -1.3, lon: 36.8 },
  bangladesh: { country: 'Bangladesh', countryCode: 'BD', lat: 23.7, lon: 90.4 },
  philippines: { country: 'Philippines', countryCode: 'PH', lat: 12.9, lon: 121.8 },
  indonesia: { country: 'Indonesia', countryCode: 'ID', lat: -0.8, lon: 113.9 },
}

function inferGeoFromTitleWHO(title: string): { country: string; countryCode: string; lat: number; lon: number } {
  const t = title.toLowerCase()
  for (const [key, geo] of Object.entries(GEO_MAP)) {
    if (t.includes(key)) {
      const jitter = (Math.random() - 0.5) * 1.5
      return { ...geo, lat: geo.lat + jitter, lon: geo.lon + jitter }
    }
  }
  return { country: 'Unknown', countryCode: 'XX', lat: 0, lon: 0 }
}

function inferSeverityRSS(title: string): IntelEvent['severity'] {
  const t = title.toLowerCase()
  if (/kill|dead|bomb|attack|missile|explosion|massacre|invasion|nuclear/.test(t)) return 'critical'
  if (/conflict|clash|military|troops|rebel|coup|hostage|terror|siege/.test(t)) return 'high'
  if (/protest|tension|sanction|crisis|ceasefire|drone/.test(t)) return 'medium'
  return 'low'
}

function inferCategoryRSS(title: string): IntelEvent['category'] {
  const t = title.toLowerCase()
  if (/disease|outbreak|virus|epidemic|health/.test(t)) return 'health'
  if (/refugee|humanitarian|famine|food/.test(t)) return 'humanitarian'
  if (/election|government|president|coup|protest/.test(t)) return 'political'
  if (/economy|sanction|trade|oil|currency/.test(t)) return 'economic'
  return 'conflict'
}

export async function GET() {
  const cached = getCache<IntelEvent[]>('all-events')
  if (cached) return NextResponse.json(cached)

  const [gdeltEvents, usgsEvents, gdacsEvents, reliefwebEvents, ucdpEvents,
         whoEvents, firmsEvents, rssEvents, acledEvents] = await Promise.all([
    fetchGDELTEvents(),
    fetchUSGSEarthquakes(),
    fetchGDACS(),
    fetchReliefWeb(),
    fetchUCDP(),
    fetchWHO(),
    fetchNASAFIRMS(),
    fetchRSSFeeds(),
    fetchACLED(),
  ])

  let all = [...STATIC_FALLBACK, ...gdeltEvents, ...usgsEvents, ...gdacsEvents,
             ...reliefwebEvents, ...ucdpEvents, ...whoEvents, ...firmsEvents,
             ...rssEvents, ...acledEvents]
  all = deduplicateEvents(all)
  all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  setCache('all-events', all, 300)
  return NextResponse.json(all)
}
