import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SUBSCRIPTION_CHANGED } from '../lib/billing'

/** The user's most recent one-time Pro purchase (a 1-month or 1-year pass). */
export interface ProAccess {
  plan_interval: 'monthly' | 'annual'
  current_period_end: string
}

/** Pro until the end of the latest paid period. Nothing renews, so the end date is the whole story. */
export function hasProAccess(access: ProAccess | null): boolean {
  return !!access && new Date(access.current_period_end).getTime() > Date.now()
}

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<ProAccess | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) { setSubscription(null); setLoading(false); return }
    const { data } = await supabase
      .from('purchases')
      .select('plan_interval, period_end')
      .eq('user_id', userId)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle()
    setSubscription(data ? { plan_interval: data.plan_interval as ProAccess['plan_interval'], current_period_end: data.period_end } : null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
    window.addEventListener(SUBSCRIPTION_CHANGED, refresh)
    return () => window.removeEventListener(SUBSCRIPTION_CHANGED, refresh)
  }, [refresh])

  return { subscription, isPro: hasProAccess(subscription), loading, refresh }
}
