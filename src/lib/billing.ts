import { supabase } from './supabaseClient'
import { PLANS } from './plans'

import type { Interval } from './plans'
export type { Interval }

export const SUBSCRIPTION_CHANGED = 'subscription-changed'

async function authedPost<T>(path: string, body?: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify(body ?? {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.')
  return json as T
}

function loadCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the payment window. Check your connection and try again.'))
    document.body.appendChild(script)
  })
}

export function notifySubscriptionChanged() {
  window.dispatchEvent(new Event(SUBSCRIPTION_CHANGED))
}

/** Opens Razorpay Checkout for a one-time Pro pass. Resolves 'paid' or 'dismissed'; rejects with a readable message on failure. */
export async function startCheckout(interval: Interval, user: { name: string; email: string }): Promise<'paid' | 'dismissed'> {
  const created = await authedPost<{ orderId: string; keyId: string; email: string }>('/api/create-order', { interval })
  await loadCheckoutScript()

  return new Promise((resolve, reject) => {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    const rzp = new (window as any).Razorpay({
      key: created.keyId,
      order_id: created.orderId,
      name: 'JobEarly',
      description: `JobEarly Pro — ${PLANS[interval].period === 'month' ? '1 month' : PLANS[interval].period === 'year' ? '1 year' : PLANS[interval].period}`,
      prefill: { name: user.name, email: created.email || user.email },
      theme: accent ? { color: accent } : undefined,
      handler: async (response: Record<string, string>) => {
        try {
          await authedPost('/api/verify-payment', response)
          notifySubscriptionChanged()
          resolve('paid')
        } catch (e) {
          reject(e)
        }
      },
      modal: { ondismiss: () => resolve('dismissed') },
    })
    rzp.on('payment.failed', (r: any) => reject(new Error(r?.error?.description || 'Payment failed. You have not been charged.')))
    rzp.open()
  })
}

/** Cancel within 7 days of the first payment: full refund, Pro ends now (enforced on the server). */
export async function cancelAndRefund() {
  const result = await authedPost<{ refunded: boolean; amount: number; currency: string }>('/api/cancel-and-refund')
  notifySubscriptionChanged()
  return result
}
