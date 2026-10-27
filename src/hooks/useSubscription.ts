import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SUBSCRIPTION_CHANGED } from '../lib/billing'
import type { Currency, Interval } from '../lib/plans'

const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/** The user's current one-time Pro pass (a 1-month, 3-month or 1-year purchase). */
export interface ProAccess {
  plan_interval: Interval
  current_period_end: string
  /** What the latest purchase cost, in whole currency units (0 for a complimentary pass). */
  amount: number
  currency: Currency
  /** Set while the customer can still cancel for a full refund (first payment, within 7 days). */
  refundableUntil: string | null
}

/** Pro until the end of the latest paid period. Nothing renews, so the end date is the whole story. */
export function hasProAccess(access: ProAccess | null): boolean {
  return !!access && new Date(access.current_period_end).getTime() > Date.now()
}

// select('*') on purpose: columns added by later migrations (refunded_at, currency) may not exist yet,
// and asking for a missing column would otherwise make Pro disappear.
interface Row {
  plan_interval: string
  period_end: string
  paid_at: string
  amount_paise: number
  refunded_at?: string | null
  currency?: string | null
}

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<ProAccess | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) { setSubscription(null); setLoading(false); return }

    const { data } = await supabase.from('purchases').select('*').eq('user_id', userId).order('paid_at', { ascending: true })
    const rows = ((data ?? []) as unknown) as Row[]
    const active = rows.filter(r => !r.refunded_at)
    if (!active.length) { setSubscription(null); setLoading(false); return }

    const latest = active.reduce((a, b) => (new Date(b.period_end) > new Date(a.period_end) ? b : a))
    const first = rows[0]
    const windowEnd = new Date(first.paid_at).getTime() + REFUND_WINDOW_MS
    const refundable = rows.length === 1 && !first.refunded_at && windowEnd > Date.now()

    setSubscription({
      plan_interval: latest.plan_interval as Interval,
      current_period_end: latest.period_end,
      amount: (latest.amount_paise ?? 0) / 100,
      currency: latest.currency === 'USD' ? 'USD' : 'INR',
      refundableUntil: refundable ? new Date(windowEnd).toISOString() : null,
    })
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
    window.addEventListener(SUBSCRIPTION_CHANGED, refresh)
    return () => window.removeEventListener(SUBSCRIPTION_CHANGED, refresh)
  }, [refresh])

  return { subscription, isPro: hasProAccess(subscription), loading, refresh }
}
