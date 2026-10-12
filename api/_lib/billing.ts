// Razorpay subscription billing, shared by server.ts (local dev) and the
// Vercel functions in api/*. Framework-agnostic: callers pass plain values and
// map BillingError to an HTTP status.
import crypto from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { sendBrandedMail } from './mailer.js'
import { receiptEmail, ownerNoticeEmail } from './emailTemplates.js'

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
      ...((sub.current_end ?? sub.end_at) ? { current_period_end: new Date((sub.current_end ?? sub.end_at) * 1000).toISOString() } : {}),
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

// ── Payment emails ──────────────────────────────────────────────────────────
// Returns true if this payment has not been emailed yet (and marks it), false if it already was,
// null if we couldn't tell (e.g. migration 0003 not applied yet).
async function claimReceipt(userId: string, paymentId: string): Promise<boolean | null> {
  const { data, error } = await admin()
    .from('subscriptions')
    .update({ last_receipt_payment_id: paymentId })
    .eq('user_id', userId)
    .or(`last_receipt_payment_id.is.null,last_receipt_payment_id.neq.${paymentId}`)
    .select('user_id')
  if (error) {
    console.error('Receipt dedupe failed (is migration 0003 applied?):', error.message)
    return null
  }
  return (data?.length ?? 0) > 0
}

// Never throws: an email problem must not fail a payment that already went through.
async function sendPaymentEmails(args: { userId: string; sub: any; payment: any; source: 'verify' | 'webhook' }) {
  const { userId, sub, payment, source } = args
  try {
    if (!payment?.id || !['captured', 'authorized'].includes(payment.status)) return

    const claimed = await claimReceipt(userId, payment.id)
    if (claimed === false) return // already sent by the other path
    if (claimed === null && source === 'webhook') return // can't dedupe: leave it to the checkout path

    const db = admin()
    const { data: userRes } = await db.auth.admin.getUserById(userId)
    const authUser = userRes?.user
    const email = authUser?.email
    if (!authUser || !email) return
    const { data: profile } = await db.from('profiles').select('name').eq('id', userId).maybeSingle()
    const name: string = profile?.name || (authUser.user_metadata?.name as string) || ''

    const receipt = {
      firstName: name.split(' ')[0] || 'there',
      interval: (sub.notes?.interval === 'annual' ? 'annual' : 'monthly') as Interval,
      amountRupees: payment.amount / 100,
      method: payment.method as string | undefined,
      paymentId: payment.id as string,
      subscriptionId: sub.id as string,
      paidAt: new Date((payment.created_at ?? Date.now() / 1000) * 1000),
      renewsAt: (sub.current_end ?? sub.end_at) ? new Date((sub.current_end ?? sub.end_at) * 1000) : null,
      isRenewal: (sub.paid_count ?? 1) > 1,
    }

    await sendBrandedMail(email, receiptEmail(receipt))

    const owner = process.env.GMAIL_USER
    if (owner) {
      await sendBrandedMail(owner, ownerNoticeEmail({ ...receipt, customerName: name, customerEmail: email }))
        .catch(e => console.error('Owner notice failed:', e))
    }
  } catch (e) {
    console.error('Payment email failed:', e)
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
      // One charge per purchase: the plan is a single 1-month / 1-year pass with no auto-renewal.
      // Razorpay derives the "charged until <date>" line in checkout from this number.
      total_count: 1,
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

  // Receipt goes out before we respond: serverless functions may be frozen once the response is sent.
  const payment = await rzp(`/payments/${paymentId}`).catch(() => null)
  await sendPaymentEmails({ userId: user.id, sub, payment, source: 'verify' })

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

  // Covers renewals (and first payments if the browser never reached verify-payment).
  if (sub && event.event === 'subscription.charged' && sub.notes?.user_id) {
    await sendPaymentEmails({ userId: sub.notes.user_id, sub, payment: event.payload?.payment?.entity, source: 'webhook' })
  }
  return { received: true }
}
