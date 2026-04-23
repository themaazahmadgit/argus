import { IntelEvent, CorrelationAlert } from '@/types'
import { haversineDistance } from './haversine'
import { CHOKEPOINTS } from './constants'

function makeId(pattern: string, country: string): string {
  const hash = `${pattern}-${country}-${new Date().toDateString()}`
  return hash.replace(/\s+/g, '-').toLowerCase()
}

function confidence(base: number, extra: number): number {
  return Math.min(95, base + extra * 10)
}

function withinHours(event: IntelEvent, hours: number): boolean {
  return Date.now() - new Date(event.timestamp).getTime() < hours * 3600000
}

function eventsNearChokepoint(events: IntelEvent[], radiusKm: number, hoursBack: number) {
  return CHOKEPOINTS.map(cp => {
    const nearby = events.filter(e =>
      withinHours(e, hoursBack) &&
      haversineDistance(e.lat, e.lon, cp.lat, cp.lon) < radiusKm
    )
    return { chokepoint: cp, events: nearby }
  }).filter(c => c.events.length > 0)
}

export function runCorrelationEngine(events: IntelEvent[]): CorrelationAlert[] {
  const alerts: CorrelationAlert[] = []

  // 1. MARITIME INTERDICTION
  const chopkeventGroups = eventsNearChokepoint(events, 300, 48)
  for (const { chokepoint, events: nearby } of chopkeventGroups) {
    if (nearby.length >= 3) {
      const sev: CorrelationAlert['severity'] = nearby.length >= 5 ? 'critical' : 'high'
      alerts.push({
        id: makeId('maritime', chokepoint.name),
        title: `Maritime Threat — ${chokepoint.name}`,
        summary: `${nearby.length} incidents detected within 300km of ${chokepoint.name} in past 48 hours. ${chokepoint.description}`,
        severity: sev,
        pattern: 'Maritime Interdiction',
        signals: nearby.slice(0, 4).map(e => e.title),
        countries: [...new Set(nearby.map(e => e.country))],
        lat: chokepoint.lat,
        lon: chokepoint.lon,
        timestamp: new Date().toISOString(),
        confidence: confidence(65, nearby.length - 3),
      })
    }
  }

  // 2. CONFLICT ESCALATION
  const byCountry = groupBy(events, e => e.country)
  for (const [country, countryEvents] of Object.entries(byCountry)) {
    const recent = countryEvents.filter(e => e.category === 'conflict' && withinHours(e, 168))
    const hasCritical = recent.some(e => e.severity === 'critical')
    if (recent.length >= 4 && hasCritical) {
      const sample = countryEvents.find(e => e.lat)!
      alerts.push({
        id: makeId('escalation', country),
        title: `Conflict Escalation — ${country}`,
        summary: `${recent.length} conflict events in ${country} over past 7 days with at least one critical incident.`,
        severity: recent.length >= 6 ? 'critical' : 'high',
        pattern: 'Conflict Escalation',
        signals: recent.slice(0, 4).map(e => e.title),
        countries: [country],
        lat: sample?.lat || 0,
        lon: sample?.lon || 0,
        timestamp: new Date().toISOString(),
        confidence: confidence(60, recent.length - 4),
      })
    }
  }

  // 3. COMPOUND CRISIS
  for (const [country, countryEvents] of Object.entries(byCountry)) {
    const recent30 = countryEvents.filter(e => withinHours(e, 720))
    const categoriesSet = new Set(recent30.map(e => e.category))
    const categoriesArr = Array.from(categoriesSet)
    if (categoriesSet.size >= 3) {
      const sample = countryEvents.find(e => e.lat)!
      alerts.push({
        id: makeId('compound', country),
        title: `Compound Crisis — ${country}`,
        summary: `${country} experiencing simultaneous crises across ${categoriesSet.size} domains: ${categoriesArr.join(', ')}.`,
        severity: 'high',
        pattern: 'Compound Crisis',
        signals: categoriesArr.map(c => `${c} crisis detected`),
        countries: [country],
        lat: sample?.lat || 0,
        lon: sample?.lon || 0,
        timestamp: new Date().toISOString(),
        confidence: confidence(55, categoriesSet.size - 3),
      })
    }
  }

  // 4. REGIONAL INSTABILITY CLUSTER
  const highSevEvents = events.filter(e => (e.severity === 'high' || e.severity === 'critical') && withinHours(e, 168))
  for (let i = 0; i < highSevEvents.length; i++) {
    const center = highSevEvents[i]
    const cluster = highSevEvents.filter(e =>
      e.id !== center.id && haversineDistance(center.lat, center.lon, e.lat, e.lon) < 500
    )
    if (cluster.length >= 4) {
      const countriesSet = new Set([center.country, ...cluster.map(e => e.country)])
      if (countriesSet.size >= 2) {
        const countriesArr = Array.from(countriesSet)
        alerts.push({
          id: makeId('regional', center.country),
          title: `Regional Instability Cluster — ${center.country} region`,
          summary: `${cluster.length + 1} high/critical events within 500km across ${countriesSet.size} countries.`,
          severity: 'high',
          pattern: 'Regional Instability',
          signals: cluster.slice(0, 3).map(e => e.title),
          countries: countriesArr,
          lat: center.lat,
          lon: center.lon,
          timestamp: new Date().toISOString(),
          confidence: confidence(55, cluster.length - 4),
        })
        break
      }
    }
  }

  // 5. INFRASTRUCTURE THREAT
  for (const cp of CHOKEPOINTS) {
    const critical = events.filter(e =>
      e.severity === 'critical' && haversineDistance(e.lat, e.lon, cp.lat, cp.lon) < 100
    )
    if (critical.length > 0) {
      alerts.push({
        id: makeId('infrastructure', cp.name),
        title: `Critical Infrastructure Threat — ${cp.name}`,
        summary: `${critical.length} critical event(s) within 100km of ${cp.name}. ${cp.description}`,
        severity: 'critical',
        pattern: 'Infrastructure Threat',
        signals: critical.slice(0, 3).map(e => e.title),
        countries: Array.from(new Set(critical.map(e => e.country))),
        lat: cp.lat,
        lon: cp.lon,
        timestamp: new Date().toISOString(),
        confidence: confidence(75, critical.length),
      })
    }
  }

  // 6. HUMANITARIAN CONVERGENCE
  for (const [country, countryEvents] of Object.entries(byCountry)) {
    const humEvents = countryEvents.filter(e => e.category === 'humanitarian' && withinHours(e, 336))
    if (humEvents.length >= 3) {
      const sample = humEvents.find(e => e.lat)!
      alerts.push({
        id: makeId('humanitarian', country),
        title: `Humanitarian Convergence — ${country}`,
        summary: `${humEvents.length} concurrent humanitarian crises detected in ${country} within 14-day window.`,
        severity: 'high',
        pattern: 'Humanitarian Convergence',
        signals: humEvents.slice(0, 3).map(e => e.title),
        countries: [country],
        lat: sample?.lat || 0,
        lon: sample?.lon || 0,
        timestamp: new Date().toISOString(),
        confidence: confidence(60, humEvents.length - 3),
      })
    }
  }

  // 7. POLITICAL DESTABILIZATION
  for (const [country, countryEvents] of Object.entries(byCountry)) {
    const polEvents = countryEvents.filter(e => e.category === 'political' && withinHours(e, 168))
    if (polEvents.length >= 3) {
      const sample = polEvents.find(e => e.lat)!
      alerts.push({
        id: makeId('political', country),
        title: `Political Destabilization — ${country}`,
        summary: `${polEvents.length} political events in ${country} in past 7 days, suggesting regime instability.`,
        severity: 'high',
        pattern: 'Political Destabilization',
        signals: polEvents.slice(0, 3).map(e => e.title),
        countries: [country],
        lat: sample?.lat || 0,
        lon: sample?.lon || 0,
        timestamp: new Date().toISOString(),
        confidence: confidence(55, polEvents.length - 3),
      })
    }
  }

  // Deduplicate by id
  const seen = new Set<string>()
  return alerts.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 }
    return order[a.severity] - order[b.severity]
  })
}

function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = fn(item)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, T[]>)
}
