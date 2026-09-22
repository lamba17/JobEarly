import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../lib/database.types'
import type { SupportTicket } from '../lib/supportTickets'

type Row = Database['public']['Tables']['support_tickets']['Row']

function fromRow(row: Row): SupportTicket {
  return {
    id: row.id,
    subject: row.subject,
    category: row.category as SupportTicket['category'],
    description: row.description,
    status: row.status as SupportTicket['status'],
    createdAt: row.created_at,
  }
}

export function useSupportTickets(userId: string | undefined) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setTickets([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setTickets(data.map(fromRow))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId])

  const addTicket = useCallback(async (data: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => {
    if (!userId) return
    const { data: row, error } = await supabase
      .from('support_tickets')
      .insert({ user_id: userId, subject: data.subject, category: data.category, description: data.description, status: 'open' })
      .select()
      .single()
    if (!error && row) setTickets(prev => [fromRow(row), ...prev])
  }, [userId])

  const toggleStatus = useCallback(async (id: string, current: SupportTicket['status']) => {
    const next = current === 'resolved' ? 'open' : 'resolved'
    const { data: row, error } = await supabase
      .from('support_tickets')
      .update({ status: next })
      .eq('id', id)
      .select()
      .single()
    if (!error && row) setTickets(prev => prev.map(t => t.id === id ? fromRow(row) : t))
  }, [])

  return { tickets, loading, addTicket, toggleStatus }
}
