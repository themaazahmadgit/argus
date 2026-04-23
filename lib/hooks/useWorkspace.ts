'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { WorkspaceData } from '@/types'

export function useWorkspace() {
  const { user, isAuthenticated } = useAuth()
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!isAuthenticated || !user) return
    supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()
      .then(({ data }: { data: WorkspaceData | null }) => { if (data) setWorkspace(data) })
  }, [isAuthenticated, user])

  const saveWorkspace = useCallback(async (updates: Partial<WorkspaceData>) => {
    if (!workspace?.id) return
    const { data } = await supabase
      .from('workspaces')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', workspace.id)
      .select()
      .single()
    if (data) setWorkspace(data as WorkspaceData)
  }, [workspace])

  return { workspace, saveWorkspace }
}
