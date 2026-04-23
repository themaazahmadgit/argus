export const SEVERITY_COLORS = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#16A34A',
} as const

export const CATEGORY_COLORS: Record<string, string> = {
  conflict: '#DC2626',
  political: '#7C3AED',
  economic: '#0891B2',
  social: '#DB2777',
  environmental: '#16A34A',
  cyber: '#4F46E5',
  earthquake: '#92400E',
  wildfire: '#EA580C',
  disaster: '#B45309',
  humanitarian: '#0369A1',
  health: '#BE185D',
}

export const CHOKEPOINTS = [
  { name: 'Strait of Hormuz', lat: 26.5, lon: 56.5, description: 'Critical oil transit point — 21% of global petroleum liquids' },
  { name: 'Suez Canal', lat: 30.5, lon: 32.3, description: 'Key trade route — 12% of global trade' },
  { name: 'Bab-el-Mandeb', lat: 12.5, lon: 43.3, description: 'Red Sea gateway — Houthi threat zone' },
  { name: 'Strait of Malacca', lat: 2.5, lon: 101.5, description: 'Asia-Pacific oil corridor — 16M bbl/day' },
  { name: 'Taiwan Strait', lat: 24.0, lon: 119.5, description: 'PRC-Taiwan flashpoint — global semiconductor supply risk' },
  { name: 'South China Sea', lat: 14.0, lon: 114.0, description: 'Contested waters — $3T annual trade' },
  { name: 'Panama Canal', lat: 9.0, lon: -79.5, description: 'Americas trade nexus — drought-impacted capacity' },
  { name: 'GIUK Gap', lat: 63.0, lon: -20.0, description: 'NATO Arctic chokepoint — Russian submarine corridor' },
]

export const SANCTIONED_COUNTRIES = ['RU', 'IR', 'KP', 'SY', 'CU', 'VE', 'BY', 'MM', 'SD', 'LY']

export const MILITARY_CALLSIGN_PREFIXES = [
  'RCH', 'REACH', 'RAF', 'IAF', 'RRR', 'CNV', 'DUKE', 'JAKE',
  'EVAC', 'MEDEVAC', 'USAF', 'ARMY', 'NAVY', 'GHOST', 'REAPER',
  'PREDATOR', 'SENTRY', 'AWACS', 'RIVET', 'COBRA', 'VIPER',
]

export const PRIORITY_COUNTRIES = [
  'Russia', 'China', 'Iran', 'Ukraine', 'Israel', 'Yemen', 'Sudan',
  'Myanmar', 'Pakistan', 'North Korea', 'Syria', 'Ethiopia', 'Somalia',
  'Mali', 'Nigeria', 'Venezuela', 'Taiwan', 'Afghanistan', 'Saudi Arabia',
  'Turkey', 'Iraq', 'Lebanon', 'Libya', 'Egypt', 'India', 'Palestine',
  'Colombia', 'Mexico', 'Philippines', 'Thailand',
]

export const FREEDOM_SCORES: Record<string, number> = {
  US: 83, GB: 93, DE: 94, FR: 89, JP: 96, AU: 97, CA: 98,
  SE: 100, NO: 100, NZ: 99, CH: 96, NL: 98, DK: 97, FI: 100,
  RU: 19, CN: 9, IR: 16, KP: 3, SY: 2, BY: 11, CU: 13,
  SA: 7, AE: 17, EG: 26, TR: 33, PK: 37, BD: 40, VN: 19,
  UA: 61, MM: 14, AF: 25, IQ: 29, LB: 42, LY: 13, SD: 8,
  YE: 11, SO: 8, ET: 27, ML: 30, NG: 45, VE: 16, MX: 60,
  IN: 67, IL: 76, PH: 55, ID: 59, BR: 73, ZA: 79, TH: 31,
}

export const FRAGILITY_SCORES: Record<string, number> = {
  SO: 113, YE: 112, SS: 111, SY: 110, CD: 109, CF: 108,
  SD: 107, AF: 106, ET: 100, ML: 95, NG: 90, MM: 89,
  IQ: 85, PK: 80, KP: 79, LB: 78, LY: 77, VE: 70,
  MX: 65, IN: 60, EG: 58, IR: 75, RU: 72, CN: 50,
  UA: 65, TR: 55, IL: 48, SA: 55, PH: 68, ID: 52,
  BR: 60, ZA: 65, BD: 72, VN: 45, TH: 60, GH: 55,
  KE: 68, TZ: 50, UZ: 55, KZ: 50,
}
