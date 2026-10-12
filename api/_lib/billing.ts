// Razorpay subscription billing, shared by server.ts (local dev) and the
// Vercel functions in api/*. Framework-agnostic: callers pass plain values and
// map BillingError to an HTTP status.
import crypto from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export class BillingError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export type Interval = 'monthly' | 'annual'

const RZP_API = 'https://api.razorpay.com/v1'

function rzpCredentials() {
  const id = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!id || !secret) throw new BillingError(503, 'Payments are not configured yet.')
  return { id, secret }
}

async function rzp(path: string, init?: { method?: string; body?: unknown }) {
  const { id, secret } = rzpCredentials()
  const res = await fetch(`${RZP_API}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })
  const json: any = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('Razorpay error:', res.status, json?.error)
    throw new BillingError(502, json?.error?.description || 'Payment provider error.')
  }
  return json
}

function supabaseUrl() {
  const url = process.env.VITE_SUPABASE_URL
  if (!url) throw new BillingError(503, 'Supabase is not configured.')
  return url
}

function admin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new BillingError(503, 'Payments are not configured yet.')
  return createClient(supabaseUrl(), key, { auth: { persistSession: false } })
}

async function authenticate(authHeader: string | undefined) {
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!token || !anon) throw new BillingError(401, 'Please sign in again.')
  const client = createClient(supabaseUrl(), anon, { auth: { persistSession: false } })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) throw new BillingError(401, 'Please sign in again.')
  return { id: data.user.id, email: data.user.email ?? '' }
}

function hmac(secret: string, payload: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

// Mirror a Razorpay subscription entity into our table.
async function applySubscription(sub: any, extra: { cancel_at_period_end?: boolean } = {}) {
  const userId: string | undefined = sub?.notes?.user_id
  if (!userId) {
    console.warn('Subscription without user_id note, ignoring:', sub?.id)
    return
  }
  const interval: Interval = sub.notes?.interval === 'annual' ? 'annual' : 'monthly'
  const { error } = await admin().from('subscriptions').upsert(
    {
      user_id: userId,
      razorpay_subscription_id: sub.id,
      razorpay_plan_id: sub.plan_id ?? null,
      plan_interval: interval,
      status: sub.status,
      current_period_end: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
      ...extra,
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('Supabase write failed:', error)
    throw new BillingError(500, `Database error: ${error.message}`)
  }
}

export async function createSubscription(authHeader: string | undefined, interval: Interval) {
  const user = await authenticate(authHeader)
  const planId = interval === 'annual' ? process.env.RAZORPAY_PLAN_ANNUAL : process.env.RAZORPAY_PLAN_MONTHLY
  if (!planId) throw new BillingError(503, 'Payments are not configured yet.')

  const { data: existing } = await admin()
    .from('subscriptions').select('status, cancel_at_period_end').eq('user_id', user.id).maybeSingle()
  if (existing && ['active', 'pending'].includes(existing.status) && !existing.cancel_at_period_end) {
    throw new BillingError(409, 'You already have an active Pro subscription.')
  }

  const sub = await rzp('/subscriptions', {
    method: 'POST',
    body: {
      plan_id: planId,
      total_count: interval === 'annual' ? 10 : 120,
      customer_notify: 1,
      notes: { user_id: user.id, interval },
    },
  })
  await applySubscription(sub, { cancel_at_period_end: false })
  return { subscriptionId: sub.id as string, keyId: rzpCredentials().id, email: user.email }
}

export async function verifyPayment(
  authHeader: string | undefined,
  body: { razorpay_payment_id?: string; razorpay_subscription_id?: string; razorpay_signature?: string },
) {
  const user = await authenticate(authHeader)
  const { razorpay_payment_id: paymentId, razorpay_subscription_id: subId, razorpay_signature: signature } = body
  if (!paymentId || !subId || !signature) throw new BillingError(400, 'Missing payment details.')

  const expected = hmac(rzpCredentials().secret, `${paymentId}|${subId}`)
  if (!safeEqual(expected, signature)) throw new BillingError(400, 'Payment verification failed.')

  const { data: row } = await admin()
    .from('subscriptions').select('razorpay_subscription_id').eq('user_id', user.id).maybeSingle()
  if (!row || row.razorpay_subscription_id !== subId) throw new BillingError(403, 'Subscription does not belong to this account.')

  // Take the status from Razorpay itself rather than trusting the client.
  const sub = await rzp(`/subscriptions/${subId}`)
  await applySubscription(sub)
  return { status: sub.status as string }
}

export async function cancelSubscription(authHeader: string | undefined) {
  const user = await authenticate(authHeader)
  const { data: row } = await admin()
    .from('subscriptions').select('razorpay_subscription_id, status').eq('user_id', user.id).maybeSingle()
  if (!row) throw new BillingError(404, 'No subscription found.')
  if (!['active', 'authenticated', 'pending'].includes(row.status)) throw new BillingError(400, 'This subscription is not active.')

  // Keep access until the period they already paid for ends (only possible once charged).
  const atCycleEnd = row.status === 'active'
  const sub = await rzp(`/subscriptions/${row.razorpay_subscription_id}/cancel`, {
    method: 'POST',
    body: { cancel_at_cycle_end: atCycleEnd ? 1 : 0 },
  })
  await applySubscription(sub, { cancel_at_period_end: atCycleEnd })
  return { status: sub.status as string, cancelAtPeriodEnd: atCycleEnd }
}

export async function handleWebhook(rawBody: string, signature: string | undefined) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) throw new BillingError(503, 'Webhook secret is not configured.')
  if (!signature || !safeEqual(hmac(secret, rawBody), signature)) throw new BillingError(400, 'Invalid signature.')

  const event = JSON.parse(rawBody)
  const sub = event?.payload?.subscription?.entity
  if (sub) await applySubscription(sub, event.event === 'subscription.cancelled' ? { cancel_at_period_end: false } : {})
  return { received: true }
}
