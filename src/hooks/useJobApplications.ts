import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../lib/database.types'
import type { JobApplication } from '../lib/jobTracker'

type Row = Database['public']['Tables']['job_applications']['Row']

function fromRow(row: Row): JobApplication {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    location: row.location,
    portal: row.portal as JobApplication['portal'],
    dateApplied: row.date_applied ?? '',
    status: row.status as JobApplication['status'],
    salary: row.salary,
    notes: row.notes,
    followUpDate: row.follow_up_date ?? '',
    createdAt: row.created_at,
  }
}

export function useJobApplications(userId: string | undefined) {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setJobs([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setJobs(data.map(fromRow))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId])

  const addJob = useCallback(async (data: Omit<JobApplication, 'id' | 'createdAt'>) => {
    if (!userId) return
    const { data: row, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: userId,
        company: data.company,
        role: data.role,
        location: data.location,
        portal: data.portal,
        date_applied: data.dateApplied || null,
        status: data.status,
        salary: data.salary,
        notes: data.notes,
        follow_up_date: data.followUpDate || null,
      })
      .select()
      .single()
    if (!error && row) setJobs(prev => [fromRow(row), ...prev])
  }, [userId])

  const updateJob = useCallback(async (id: string, data: Partial<Omit<JobApplication, 'id' | 'createdAt'>>) => {
    const patch: Database['public']['Tables']['job_applications']['Update'] = {}
    if (data.company !== undefined) patch.company = data.company
    if (data.role !== undefined) patch.role = data.role
    if (data.location !== undefined) patch.location = data.location
    if (data.portal !== undefined) patch.portal = data.portal
    if (data.dateApplied !== undefined) patch.date_applied = data.dateApplied || null
    if (data.status !== undefined) patch.status = data.status
    if (data.salary !== undefined) patch.salary = data.salary
    if (data.notes !== undefined) patch.notes = data.notes
    if (data.followUpDate !== undefined) patch.follow_up_date = data.followUpDate || null

    const { data: row, error } = await supabase
      .from('job_applications')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error && row) setJobs(prev => prev.map(j => j.id === id ? fromRow(row) : j))
  }, [])

  const deleteJob = useCallback(async (id: string) => {
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (!error) setJobs(prev => prev.filter(j => j.id !== id))
  }, [])

  return { jobs, loading, addJob, updateJob, deleteJob }
}
