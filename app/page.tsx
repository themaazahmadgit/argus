'use client'
import { useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useMapStore } from '@/stores/mapStore'
import { IntelEvent, CorrelationAlert, Situation } from '@/types'
import Header from '@/components/Header'
import EventFeed from '@/components/EventFeed'
import CountryPanel from '@/components/CountryPanel'
import BriefPanel from '@/components/BriefPanel'
import AlertsPanel from '@/components/AlertsPanel'
import SituationsPanel from '@/components/SituationsPanel'
import CountriesPanel from '@/components/CountriesPanel'
import CommoditiesPanel from '@/components/CommoditiesPanel'
import ComparePanel from '@/components/ComparePanel'
import CommandBar from '@/components/CommandBar'
import AuthModal from '@/components/AuthModal'

const ArgusMap = dynamic(() => import('@/components/ArgusMap'), { ssr: false })

export default function Home() {
  const { panels, togglePanel, setEvents, setAlerts, setSituations } = useMapStore()

  const { data: eventsData } = useQuery<IntelEvent[]>({
    queryKey: ['events'],
    queryFn: () => fetch('/api/events').then(r => r.json()),
    refetchInterval: 300000,
  })

  useEffect(() => {
    if (eventsData?.length) {
      setEvents(eventsData)
      fetch('/api/correlations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsData }),
      }).then(r => r.json()).then((alerts: CorrelationAlert[]) => setAlerts(alerts)).catch(() => {})

      fetch('/api/situations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsData }),
      }).then(r => r.json()).then((situations: Situation[]) => setSituations(situations)).catch(() => {})
    }
  }, [eventsData])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      togglePanel('commandBar')
    }
    if (e.key === 'Escape') {
      useMapStore.getState().closeAllPanels()
    }
  }, [togglePanel])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {panels.eventFeed && <EventFeed />}
        <div style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden' }}>
          <ArgusMap />
        </div>
        {panels.country && <CountryPanel />}
        {panels.alerts && <AlertsPanel />}
        {panels.situations && <SituationsPanel />}
        {panels.countries && <CountriesPanel />}
        {panels.commodities && <CommoditiesPanel />}
        {panels.compare && <ComparePanel />}
      </div>
      {panels.brief && <BriefPanel />}
      {panels.commandBar && <CommandBar />}
      {panels.authModal && <AuthModal />}
    </div>
  )
}
