import { NextResponse } from 'next/server'
import { AircraftPosition } from '@/types'
import { getCache, setCache } from '@/lib/cache'
import { MILITARY_CALLSIGN_PREFIXES } from '@/lib/constants'

const PROCEDURAL_AIRCRAFT: AircraftPosition[] = [
  // US Military — Middle East
  { icao24: 'ae1234', callsign: 'RCH456', origin_country: 'United States', longitude: 35.0, latitude: 33.0, baro_altitude: 11000, velocity: 850, on_ground: false, type: 'military' },
  { icao24: 'ae2345', callsign: 'USAF789', origin_country: 'United States', longitude: 44.0, latitude: 26.0, baro_altitude: 9000, velocity: 820, on_ground: false, type: 'military' },
  { icao24: 'ae3456', callsign: 'REACH12', origin_country: 'United States', longitude: 50.5, latitude: 24.5, baro_altitude: 10500, velocity: 840, on_ground: false, type: 'military' },
  { icao24: 'ae4000', callsign: 'JAKE11', origin_country: 'United States', longitude: 38.5, latitude: 36.0, baro_altitude: 8500, velocity: 780, on_ground: false, type: 'military' },
  { icao24: 'ae5001', callsign: 'DRAGN1', origin_country: 'United States', longitude: 43.0, latitude: 15.5, baro_altitude: 9200, velocity: 800, on_ground: false, type: 'military' },
  // UK / NATO
  { icao24: 'ae3500', callsign: 'RAF101', origin_country: 'United Kingdom', longitude: 43.5, latitude: 12.0, baro_altitude: 10000, velocity: 800, on_ground: false, type: 'military' },
  { icao24: 'ae3600', callsign: 'NATO22', origin_country: 'Belgium', longitude: 17.0, latitude: 48.5, baro_altitude: 9800, velocity: 790, on_ground: false, type: 'military' },
  // AWACS / ISR
  { icao24: 'ae4567', callsign: 'SENTRY1', origin_country: 'United States', longitude: 119.5, latitude: 24.5, baro_altitude: 9500, velocity: 780, on_ground: false, type: 'military' },
  { icao24: 'ae4600', callsign: 'ARIES21', origin_country: 'United States', longitude: 57.0, latitude: 25.0, baro_altitude: 11000, velocity: 760, on_ground: false, type: 'military' },
  { icao24: 'ae4700', callsign: 'RIVET12', origin_country: 'United States', longitude: 30.0, latitude: 50.0, baro_altitude: 10000, velocity: 770, on_ground: false, type: 'military' },
  // Russian Military
  { icao24: 'ra1234', callsign: 'RFF001', origin_country: 'Russia', longitude: 37.6, latitude: 55.7, baro_altitude: 8000, velocity: 740, on_ground: false, type: 'military' },
  { icao24: 'ra2345', callsign: 'RFF002', origin_country: 'Russia', longitude: 60.0, latitude: 56.0, baro_altitude: 9000, velocity: 720, on_ground: false, type: 'military' },
  // Chinese Military
  { icao24: 'cn1234', callsign: 'PLA001', origin_country: 'China', longitude: 121.5, latitude: 25.0, baro_altitude: 8500, velocity: 800, on_ground: false, type: 'military' },
  { icao24: 'cn2345', callsign: 'PLAAF1', origin_country: 'China', longitude: 114.0, latitude: 22.3, baro_altitude: 7500, velocity: 780, on_ground: false, type: 'military' },
  // Civil / Commercial
  { icao24: 'fr1234', callsign: 'AFR123', origin_country: 'France', longitude: 2.3, latitude: 48.9, baro_altitude: 11500, velocity: 870, on_ground: false, type: 'civil' },
  { icao24: 'de1234', callsign: 'DLH456', origin_country: 'Germany', longitude: 8.7, latitude: 50.0, baro_altitude: 11000, velocity: 860, on_ground: false, type: 'civil' },
  { icao24: 'gb1234', callsign: 'BAW789', origin_country: 'United Kingdom', longitude: -0.5, latitude: 51.5, baro_altitude: 10500, velocity: 850, on_ground: false, type: 'civil' },
  { icao24: 'sg1234', callsign: 'SIA321', origin_country: 'Singapore', longitude: 103.8, latitude: 1.3, baro_altitude: 12000, velocity: 880, on_ground: false, type: 'civil' },
  { icao24: 'ae9001', callsign: 'UAE504', origin_country: 'United Arab Emirates', longitude: 55.4, latitude: 25.2, baro_altitude: 11500, velocity: 870, on_ground: false, type: 'civil' },
  { icao24: 'tr1234', callsign: 'THY201', origin_country: 'Turkey', longitude: 29.0, latitude: 41.0, baro_altitude: 10000, velocity: 840, on_ground: false, type: 'civil' },
  // Cargo
  { icao24: 'a00001', callsign: 'UPS456', origin_country: 'United States', longitude: -100.0, latitude: 35.0, baro_altitude: 10500, velocity: 860, on_ground: false, type: 'cargo' },
  { icao24: 'a00002', callsign: 'FDX123', origin_country: 'United States', longitude: -87.6, latitude: 41.9, baro_altitude: 9500, velocity: 840, on_ground: false, type: 'cargo' },
  { icao24: 'a00003', callsign: 'GTI901', origin_country: 'United States', longitude: 121.5, latitude: 31.2, baro_altitude: 11000, velocity: 870, on_ground: false, type: 'cargo' },
  // Patrol / Maritime
  { icao24: 'ae6001', callsign: 'POSDN1', origin_country: 'United States', longitude: 57.5, latitude: 20.0, baro_altitude: 3000, velocity: 550, on_ground: false, type: 'military' },
  { icao24: 'ae6002', callsign: 'EP3E01', origin_country: 'United States', longitude: 125.0, latitude: 20.0, baro_altitude: 4500, velocity: 520, on_ground: false, type: 'military' },
]

function jitter(val: number, range = 2): number {
  return val + (Math.random() - 0.5) * range
}

function classifyAircraft(callsign: string): AircraftPosition['type'] {
  const cs = callsign.trim().toUpperCase()
  if (MILITARY_CALLSIGN_PREFIXES.some(p => cs.startsWith(p))) return 'military'
  if (/^(UPS|FDX|ULD|GTI|ABX|CAL|GIA|CAO)/.test(cs)) return 'cargo'
  return 'civil'
}

function applyJitter(aircraft: AircraftPosition[]): AircraftPosition[] {
  return aircraft.map(a => ({ ...a, latitude: jitter(a.latitude), longitude: jitter(a.longitude) }))
}

export async function GET() {
  const cached = getCache<AircraftPosition[]>('aviation')
  if (cached) return NextResponse.json(cached)

  // Try adsb.fi first (no auth required)
  try {
    const res = await fetch('https://api.adsb.fi/v2/lat/30/lon/45/dist/5000', { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = await res.json()
      const aircraft: AircraftPosition[] = (data.ac || [])
        .filter((a: Record<string, unknown>) => !a.gnd && a.lon != null && a.lat != null)
        .slice(0, 100)
        .map((a: Record<string, unknown>) => ({
          icao24: String(a.hex || ''),
          callsign: String(a.flight || a.r || '').trim(),
          origin_country: String(a.r || 'Unknown'),
          longitude: Number(a.lon),
          latitude: Number(a.lat),
          baro_altitude: Number(a.alt_baro || a.alt_geom || 0),
          velocity: Number(a.gs || 0),
          on_ground: Boolean(a.gnd),
          type: classifyAircraft(String(a.flight || '')),
        }))
      if (aircraft.length > 10) {
        setCache('aviation', aircraft, 30)
        return NextResponse.json(aircraft)
      }
    }
  } catch { /* fall through */ }

  // Try OpenSky
  try {
    const res = await fetch('https://opensky-network.org/api/states/all', { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
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
      if (aircraft.length > 10) {
        setCache('aviation', aircraft, 30)
        return NextResponse.json(aircraft)
      }
    }
  } catch { /* fall through */ }

  const result = applyJitter(PROCEDURAL_AIRCRAFT)
  setCache('aviation', result, 30)
  return NextResponse.json(result)
}
