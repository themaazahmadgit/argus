import { create } from 'zustand'
import { IntelEvent, CorrelationAlert, Situation } from '@/types'

interface Viewport {
  latitude: number
  longitude: number
  zoom: number
  pitch: number
  bearing: number
}

interface Layers {
  events: boolean
  disasters: boolean
  chokepoints: boolean
  alerts: boolean
  aviation: boolean
  vessels: boolean
  cables: boolean
  pipelines: boolean
  plots: boolean
}

interface Panels {
  eventFeed: boolean
  country: boolean
  brief: boolean
  alerts: boolean
  situations: boolean
  countries: boolean
  commodities: boolean
  compare: boolean
  commandBar: boolean
  authModal: boolean
}

interface MapStore {
  viewport: Viewport
  selectedCountry: string | null
  selectedCountryCode: string | null
  selectedEvent: IntelEvent | null
  events: IntelEvent[]
  alerts: CorrelationAlert[]
  situations: Situation[]
  layers: Layers
  panels: Panels
  eventFilter: string
  searchQuery: string
  plottingMode: 'none' | 'point' | 'zone' | 'draw' | 'zone-builder'
  pendingPlotGeometry: unknown
  flyTo: (lat: number, lon: number, zoom?: number) => void
  setViewport: (viewport: Partial<Viewport>) => void
  setSelectedCountry: (name: string, code: string) => void
  clearSelection: () => void
  toggleLayer: (key: keyof Layers) => void
  togglePanel: (key: keyof Panels) => void
  closeAllPanels: () => void
  setEvents: (events: IntelEvent[]) => void
  setAlerts: (alerts: CorrelationAlert[]) => void
  setSituations: (situations: Situation[]) => void
  setEventFilter: (filter: string) => void
  setSearchQuery: (q: string) => void
  setPlottingMode: (mode: MapStore['plottingMode']) => void
  setPendingPlotGeometry: (geo: unknown) => void
  setSelectedEvent: (event: IntelEvent | null) => void
  _flyToCallback: ((lat: number, lon: number, zoom?: number) => void) | null
  setFlyToCallback: (cb: (lat: number, lon: number, zoom?: number) => void) => void
}

export const useMapStore = create<MapStore>((set, get) => ({
  viewport: { latitude: 20, longitude: 10, zoom: 2, pitch: 0, bearing: 0 },
  selectedCountry: null,
  selectedCountryCode: null,
  selectedEvent: null,
  events: [],
  alerts: [],
  situations: [],
  layers: {
    events: true, disasters: true, chokepoints: true, alerts: true,
    aviation: false, vessels: false, cables: false, pipelines: false, plots: true,
  },
  panels: {
    eventFeed: true, country: false, brief: false, alerts: false, situations: false,
    countries: false, commodities: false, compare: false, commandBar: false, authModal: false,
  },
  eventFilter: 'all',
  searchQuery: '',
  plottingMode: 'none',
  pendingPlotGeometry: null,
  _flyToCallback: null,

  flyTo: (lat, lon, zoom) => {
    const cb = get()._flyToCallback
    if (cb) cb(lat, lon, zoom)
    set(s => ({ viewport: { ...s.viewport, latitude: lat, longitude: lon, zoom: zoom ?? s.viewport.zoom } }))
  },

  setViewport: (viewport) => set(s => ({ viewport: { ...s.viewport, ...viewport } })),

  setSelectedCountry: (name, code) => set({
    selectedCountry: name,
    selectedCountryCode: code,
    panels: { ...get().panels, country: true, brief: false },
  }),

  clearSelection: () => set({ selectedCountry: null, selectedCountryCode: null, selectedEvent: null }),

  toggleLayer: (key) => set(s => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),

  togglePanel: (key) => set(s => ({
    panels: { ...s.panels, [key]: !s.panels[key] },
  })),

  closeAllPanels: () => set(s => ({
    panels: Object.keys(s.panels).reduce((acc, k) => ({ ...acc, [k]: false }), {} as Panels),
  })),

  setEvents: (events) => set({ events }),
  setAlerts: (alerts) => set({ alerts }),
  setSituations: (situations) => set({ situations }),
  setEventFilter: (filter) => set({ eventFilter: filter }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setPlottingMode: (mode) => set({ plottingMode: mode }),
  setPendingPlotGeometry: (geo) => set({ pendingPlotGeometry: geo }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  setFlyToCallback: (cb) => set({ _flyToCallback: cb }),
}))
