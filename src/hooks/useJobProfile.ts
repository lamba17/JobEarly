import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface JobProfile {
  resumeText: string
  targetRole: string
  city: string
  country: string
}

const EMPTY: JobProfile = { resumeText: '', targetRole: '', city: '', country: '' }

/** The saved resume text, target role and city that Find Jobs scores listings against. */
export function useJobProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<JobProfile>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    let live = true
    // `as any`: job_profiles arrives with migration 0008, after the generated types were last built.
    ;(supabase as any).from('job_profiles').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data }: { data: any }) => {
        if (!live) return
        if (data) setProfile({ resumeText: data.resume_text, targetRole: data.target_role, city: data.city, country: data.country })
        setLoading(false)
      })
    return () => { live = false }
  }, [userId])

  const save = useCallback(async (next: JobProfile): Promise<boolean> => {
    if (!userId) return false
    setSaveError('')
    const { error } = await (supabase as any).from('job_profiles').upsert({
      user_id: userId,
      resume_text: next.resumeText.slice(0, 20000),
      target_role: next.targetRole.slice(0, 120),
      city: next.city.slice(0, 80),
      country: next.country.slice(0, 2).toUpperCase(),
      updated_at: new Date().toISOString(),
    })
    if (error) {
      setSaveError('Could not save your profile. Please try again.')
      return false
    }
    setProfile(next)
    return true
  }, [userId])

  return { profile, loading, save, saveError }
}
