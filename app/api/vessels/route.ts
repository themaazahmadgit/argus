import { NextResponse } from 'next/server'
import { VesselPosition } from '@/types'
import { getCache, setCache } from '@/lib/cache'

let sdnCache: { names: Set<string>; expiry: number } | null = null

async function loadSDN(): Promise<Set<string>> {
  if (sdnCache && Date.now() < sdnCache.expiry) return sdnCache.names
  try {
    const res = await fetch('https://www.treasury.gov/ofac/downloads/sdn.csv', {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return new Set()
    const text = await res.text()
    const names = new Set<string>()
    for (const line of text.split('\n')) {
      const parts = line.split(',')
      if (parts[1]) {
        const name = parts[1].replace(/"/g, '').trim().toUpperCase()
        if (name.length > 3) names.add(name)
      }
    }
    sdnCache = { names, expiry: Date.now() + 86400000 }
    return names
  } catch {
    return new Set()
  }
}

const LEGACY_SANCTIONED = ['SHADOW', 'DARK', 'GHOST', 'PHANTOM', 'ARCTIC']

const PROCEDURAL_VESSELS: VesselPosition[] = [
  { mmsi: '123456789', name: 'PACIFIC STAR', lat: 1.3, lon: 103.8, speed: 14, heading: 320, ship_type: 'Container', flag: 'SG', destination: 'ROTTERDAM', sanctioned: false },
  { mmsi: '234567890', name: 'HORMUZ CARRIER', lat: 26.5, lon: 56.3, speed: 11, heading: 45, ship_type: 'Tanker', flag: 'PA', destination: 'SINGAPORE', sanctioned: false },
  { mmsi: '345678901', name: 'SUEZ MARITIME', lat: 30.4, lon: 32.5, speed: 8, heading: 180, ship_type: 'Bulk Carrier', flag: 'LR', destination: 'JEDDAH', sanctioned: false },
  { mmsi: '456789012', name: 'SHADOW TRADER', lat: 25.0, lon: 57.0, speed: 6, heading: 90, ship_type: 'Tanker', flag: 'IR', destination: 'UNKNOWN', sanctioned: true },
  { mmsi: '567890123', name: 'BOSPHORUS QUEEN', lat: 41.0, lon: 29.0, speed: 10, heading: 270, ship_type: 'Container', flag: 'TR', destination: 'PIRAEUS', sanctioned: false },
  { mmsi: '678901234', name: 'RED SEA EAGLE', lat: 12.8, lon: 43.5, speed: 12, heading: 315, ship_type: 'Tanker', flag: 'SA', destination: 'HOUSTON', sanctioned: false },
  { mmsi: '789012345', name: 'MALACCA SPIRIT', lat: 3.0, lon: 101.0, speed: 15, heading: 290, ship_type: 'Container', flag: 'MY', destination: 'SHANGHAI', sanctioned: false },
  { mmsi: '890123456', name: 'ARCTIC PIONEER', lat: 64.0, lon: -18.0, speed: 9, heading: 60, ship_type: 'Cargo', flag: 'RU', destination: 'MURMANSK', sanctioned: true },
  { mmsi: '901234567', name: 'TAIWAN PACIFIC', lat: 23.8, lon: 120.5, speed: 13, heading: 200, ship_type: 'Container', flag: 'TW', destination: 'KAOHSIUNG', sanctioned: false },
  { mmsi: '012345678', name: 'PANAMA HAWK', lat: 9.2, lon: -79.8, speed: 7, heading: 180, ship_type: 'Container', flag: 'PA', destination: 'MIAMI', sanctioned: false },
]

export async function GET() {
  const cached = getCache<VesselPosition[]>('vessels')
  if (cached) return NextResponse.json(cached)

  const sdnNames = await loadSDN()

  const vessels = PROCEDURAL_VESSELS.map(v => {
    const nameUpper = v.name.toUpperCase()
    const sanctioned = sdnNames.size > 0
      ? sdnNames.has(nameUpper)
      : LEGACY_SANCTIONED.some(s => nameUpper.includes(s))
    return {
      ...v,
      sanctioned: sanctioned || v.sanctioned,
      lat: v.lat + (Math.random() - 0.5) * 0.5,
      lon: v.lon + (Math.random() - 0.5) * 0.5,
    }
  })

  setCache('vessels', vessels, 60)
  return NextResponse.json(vessels)
}
