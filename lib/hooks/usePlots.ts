'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { Plot } from '@/types'

export function usePlots(workspaceId: string | undefined) {
  const { isAuthenticated } = useAuth()
  const [plots, setPlots] = useState<Plot[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!isAuthenticated || !workspaceId) return
    supabase
      .from('plots')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: Plot[] | null }) => { if (data) setPlots(data) })
  }, [isAuthenticated, workspaceId])

  const createPlot = useCallback(async (plot: Omit<Plot, 'id' | 'created_at' | 'updated_at'>) => {
    if (!workspaceId) return null
    const { data, error } = await supabase.from('plots').insert(plot).select().single()
    if (data) setPlots(prev => [data as Plot, ...prev])
    return error ? null : data
  }, [workspaceId])

  const updatePlot = useCallback(async (id: string, updates: Partial<Plot>) => {
    const { data } = await supabase.from('plots').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (data) setPlots(prev => prev.map(p => p.id === id ? data as Plot : p))
  }, [])

  const deletePlot = useCallback(async (id: string) => {
    await supabase.from('plots').delete().eq('id', id)
    setPlots(prev => prev.filter(p => p.id !== id))
  }, [])

  return { plots, createPlot, updatePlot, deletePlot }
}
