import { NextResponse } from 'next/server'
import { AircraftPosition } from '@/types'
import { getCache, setCache } from '@/lib/cache'
import { MILITARY_CALLSIGN_PREFIXES } from '@/lib/constants'

const PROCEDURAL_AIRCRAFT: AircraftPosition[] = [
  { icao24: 'ae1234', callsign: 'RCH456', origin_country: 'United States', longitude: 35.0, latitude: 33.0, baro_altitude: 11000, velocity: 850, on_ground: false, type: 'military' },
  { icao24: 'ae2345', callsign: 'USAF789', origin_country: 'United States', longitude: 44.0, latitude: 26.0, baro_altitude: 9000, velocity: 820, on_ground: false, type: 'military' },
  { icao24: 'ae3456', callsign: 'RAF101', origin_country: 'United Kingdom', longitude: 43.5, latitude: 12.0, baro_altitude: 10000, velocity: 800, on_ground: false, type: 'military' },
  { icao24: 'ae4567', callsign: 'SENTRY1', origin_country: 'United States', longitude: 119.5, latitude: 24.5, baro_altitude: 9500, velocity: 780, on_ground: false, type: 'military' },
  { icao24: 'fr1234', callsign: 'AFR123', origin_country: 'France', longitude: 2.3, latitude: 48.9, baro_altitude: 11500, velocity: 870, on_ground: false, type: 'civil' },
  { icao24: 'a00001', callsign: 'UPS456', origin_country: 'United States', longitude: -100.0, latitude: 35.0, baro_altitude: 10500, velocity: 860, on_ground: false, type: 'cargo' },
]

function classifyAircraft(callsign: string): AircraftPosition['type'] {
  const cs = callsign.trim().toUpperCase()
  if (MILITARY_CALLSIGN_PREFIXES.some(p => cs.startsWith(p))) return 'military'
  if (/^(UPS|FDX|ULD|GTI|ABX|CAL|GIA|CAO)/.test(cs)) return 'cargo'
  return 'civil'
}

export async function GET() {
  const cached = getCache<AircraftPosition[]>('aviation')
  if (cached) return NextResponse.json(cached)

  try {
    const res = await fetch('https://opensky-network.org/api/states/all', { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error('OpenSky unavailable')
    const data = await res.json()
    const states = data.states || []
    const aircraft: AircraftPosition[] = states
      .filter((s: unknown[]) => s[8] === false && s[5] !== null && s[6] !== null)
      .slice(0, 100)
      .map((s: unknown[]) => ({
        icao24: String(s[0] || ''),
        callsign: String(s[1] || '').trim(),
        origin_country: String(s[2] || 'Unknown'),
        longitude: Number(s[5]),
        latitude: Number(s[6]),
        baro_altitude: Number(s[7] || 0),
        velocity: Number(s[9] || 0),
        on_ground: Boolean(s[8]),
        type: classifyAircraft(String(s[1] || '')),
      }))

    const result = aircraft.length > 10 ? aircraft : PROCEDURAL_AIRCRAFT
    setCache('aviation', result, 30)
    return NextResponse.json(result)
  } catch {
    setCache('aviation', PROCEDURAL_AIRCRAFT, 30)
    return NextResponse.json(PROCEDURAL_AIRCRAFT)
  }
}
