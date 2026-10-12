import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SUBSCRIPTION_CHANGED } from '../lib/billing'
import type { Database } from '../lib/database.types'

export type Subscription = Database['public']['Tables']['subscriptions']['Row']

/** Pro while the subscription is live, or (if cancelled) until the period already paid for ends. */
export function hasProAccess(sub: Subscription | null): boolean {
  if (!sub) return false
  const endsAt = sub.current_period_end ? new Date(sub.current_period_end).getTime() : 0
  // Each plan is a single 1-month / 1-year pass: the end date decides access, even if the
  // 'completed' webhook never reached us and the status still says 'active'.
  if (endsAt > 0 && endsAt < Date.now()) return false
  if (sub.status === 'active' || sub.status === 'pending') return true
  return (sub.status === 'cancelled' || sub.status === 'completed' || sub.cancel_at_period_end) && endsAt > Date.now()
}

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) { setSubscription(null); setLoading(false); return }
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle()
    setSubscription(data ?? null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
    window.addEventListener(SUBSCRIPTION_CHANGED, refresh)
    return () => window.removeEventListener(SUBSCRIPTION_CHANGED, refresh)
  }, [refresh])

  return { subscription, isPro: hasProAccess(subscription), loading, refresh }
}
