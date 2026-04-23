export interface IntelEvent {
  id: string
  source: 'gdelt' | 'acled' | 'usgs' | 'gdacs' | 'who' | 'firms' | 'reliefweb' | 'ocha' | 'fewsnet' | 'rss' | 'unhcr' | 'ucdp'
  category: 'conflict' | 'political' | 'economic' | 'social' | 'environmental' | 'cyber' | 'earthquake' | 'wildfire' | 'disaster' | 'humanitarian' | 'health'
  title: string
  summary: string
  lat: number
  lon: number
  country: string
  countryCode: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  timestamp: string
  url: string
  fatalities?: number
  source_detail?: string
}

export interface CorrelationAlert {
  id: string
  title: string
  summary: string
  severity: 'critical' | 'high' | 'medium'
  pattern: string
  signals: string[]
  countries: string[]
  lat: number
  lon: number
  timestamp: string
  confidence: number
}

export interface Situation {
  id: string
  name: string
  countries: string[]
  eventCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  trend: 'escalating' | 'stable' | 'de-escalating'
  trendPercent: number
  sources: string[]
  topEvents: IntelEvent[]
  lat: number
  lon: number
  activeSince: string
}

export interface CountryProfile {
  name: string
  code: string
  capital: string
  region: string
  subregion: string
  population: number
  flag: string
  riskScore: number
  gdp: number
  gdpGrowth: number
  inflation: number
  militarySpending: number
  debtToGdp: number
  freedomScore: number
  fragilityScore: number
  recentEvents: IntelEvent[]
  economicHistory: { year: number; gdp: number; inflation: number }[]
}

export interface Plot {
  id: string
  workspace_id: string
  type: 'point' | 'zone' | 'polygon'
  title: string
  description?: string
  notes?: string
  category: 'military' | 'economic' | 'political' | 'infrastructure' | 'humanitarian' | 'intelligence' | 'custom'
  threat_level: 'critical' | 'high' | 'medium' | 'low' | 'info'
  geometry: {
    type: 'Point' | 'Polygon' | 'Circle'
    coordinates: number[] | number[][]
    radius?: number
  }
  created_at: string
  updated_at: string
}

export interface WorkspaceData {
  id: string
  name: string
  layers_config: Record<string, boolean>
  viewport: { latitude: number; longitude: number; zoom: number }
  filters_config: Record<string, unknown>
}

export interface Commodity {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'flat'
}

export interface AircraftPosition {
  icao24: string
  callsign: string
  origin_country: string
  longitude: number
  latitude: number
  baro_altitude: number
  velocity: number
  on_ground: boolean
  type: 'military' | 'cargo' | 'civil'
}

export interface VesselPosition {
  mmsi: string
  name: string
  lat: number
  lon: number
  speed: number
  heading: number
  ship_type: string
  flag: string
  destination: string
  sanctioned: boolean
}
