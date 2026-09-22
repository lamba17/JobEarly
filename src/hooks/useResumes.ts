import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { ResumeDoc } from '../lib/userStore'

export function useResumes(userId: string | undefined) {
  const [resumes, setResumes] = useState<ResumeDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setResumes([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setResumes(data.map(row => ({ title: row.title, savedAt: row.saved_at, atsScore: row.ats_score })))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId])

  const addResume = useCallback(async (title: string, atsScore: number) => {
    if (!userId) return
    const { data: row, error } = await supabase
      .from('resumes')
      .insert({ user_id: userId, title, ats_score: atsScore })
      .select()
      .single()
    if (!error && row) {
      setResumes(prev => [{ title: row.title, savedAt: row.saved_at, atsScore: row.ats_score }, ...prev])
    }
  }, [userId])

  return { resumes, loading, addResume }
}
