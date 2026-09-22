import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../lib/database.types'
import type { CoverLetter } from '../lib/coverLetters'

type Row = Database['public']['Tables']['cover_letters']['Row']

function fromRow(row: Row): CoverLetter {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    letter: row.letter,
    tone: row.tone as CoverLetter['tone'],
    createdAt: row.created_at,
  }
}

export function useCoverLetters(userId: string | undefined) {
  const [letters, setLetters] = useState<CoverLetter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLetters([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setLetters(data.map(fromRow))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId])

  const saveLetter = useCallback(async (id: string | null, data: Omit<CoverLetter, 'id' | 'createdAt'>): Promise<CoverLetter | null> => {
    if (!userId) return null
    if (id) {
      const { data: row, error } = await supabase
        .from('cover_letters')
        .update({ company: data.company, role: data.role, letter: data.letter, tone: data.tone })
        .eq('id', id)
        .select()
        .single()
      if (error || !row) return null
      const updated = fromRow(row)
      setLetters(prev => prev.map(l => l.id === id ? updated : l))
      return updated
    }
    const { data: row, error } = await supabase
      .from('cover_letters')
      .insert({ user_id: userId, company: data.company, role: data.role, letter: data.letter, tone: data.tone })
      .select()
      .single()
    if (error || !row) return null
    const created = fromRow(row)
    setLetters(prev => [created, ...prev])
    return created
  }, [userId])

  const deleteLetter = useCallback(async (id: string) => {
    const { error } = await supabase.from('cover_letters').delete().eq('id', id)
    if (!error) setLetters(prev => prev.filter(l => l.id !== id))
  }, [])

  return { letters, loading, saveLetter, deleteLetter }
}
