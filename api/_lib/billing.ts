// One-time Pro payments through Razorpay Orders, shared by server.ts (local dev) and the
// Vercel functions in api/*. Framework-agnostic: callers pass plain values and map
// BillingError to an HTTP status.
//
// Flow: create-order -> Razorpay Checkout -> verify-payment (signature + server-side lookup)
//       -> a row in `purchases` -> receipt emails. The webhook is a safety net for the same step.
import crypto from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { sendBrandedMail } from './mailer.js'
import { receiptEmail, ownerNoticeEmail, refundEmail, ownerRefundNoticeEmail } from './emailTemplates.js'

export class BillingError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export type Interval = 'monthly' | 'annual'

// Prices live on the server so a browser can never choose its own amount (paise).
const PRICES_PAISE: Record<Interval, number> = { monthly: 19900, annual: 118800 }

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

/** Calendar-accurate: 12 Oct + 1 month = 12 Nov; 31 Jan + 1 month = 28/29 Feb (never spills into March). */
export function addPeriod(from: Date, interval: Interval): Date {
  const months = interval === 'annual' ? 12 : 1
  const d = new Date(from)
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, lastDay))
  return d
}

// ── Payment emails ──────────────────────────────────────────────────────────
// Never throws: an email problem must not fail a payment that already went through.
async function sendPaymentEmails(args: {
  userId: string
  interval: Interval
  payment: any
  orderId: string
  paidAt: Date
  periodEnd: Date
  isRenewal: boolean
}) {
  const { userId, interval, payment, orderId, paidAt, periodEnd, isRenewal } = args
  try {
    const db = admin()
    const { data: userRes } = await db.auth.admin.getUserById(userId)
    const authUser = userRes?.user
    const email = authUser?.email
    if (!authUser || !email) return
    const { data: profile } = await db.from('profiles').select('name').eq('id', userId).maybeSingle()
    const name: string = profile?.name || (authUser.user_metadata?.name as string) || ''

    const receipt = {
      firstName: name.split(' ')[0] || 'there',
      interval,
      amountRupees: payment.amount / 100,
      method: payment.method as string | undefined,
      paymentId: payment.id as string,
      orderId,
      paidAt,
      periodEnd,
      isRenewal,
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

// ── Fulfilment ──────────────────────────────────────────────────────────────
// Turns a Razorpay payment id into a purchase row (idempotent). Everything is read back from
// Razorpay itself, never trusted from the browser.
async function fulfilPayment(paymentId: string, expectedUserId?: string) {
  const payment = await rzp(`/payments/${paymentId}`)
  if (!payment.order_id) throw new BillingError(400, 'This payment is not linked to a JobEarly order.')

  const order = await rzp(`/orders/${payment.order_id}`)
  const userId: string | undefined = order.notes?.user_id
  const interval: Interval | undefined =
    order.notes?.interval === 'annual' ? 'annual' : order.notes?.interval === 'monthly' ? 'monthly' : undefined
  if (!userId || !interval) throw new BillingError(400, 'Unrecognised order.')
  if (expectedUserId && userId !== expectedUserId) throw new BillingError(403, 'This payment belongs to a different account.')
  if (order.amount !== PRICES_PAISE[interval] || payment.amount !== order.amount) {
    throw new BillingError(400, 'Payment amount does not match the plan price.')
  }

  let status: string = payment.status
  if (status === 'authorized') {
    await rzp(`/payments/${paymentId}/capture`, { method: 'POST', body: { amount: payment.amount, currency: 'INR' } })
    status = 'captured'
  }
  if (status !== 'captured') throw new BillingError(402, 'Payment has not been completed.')

  const db = admin()
  const paidAt = new Date((payment.created_at ?? Date.now() / 1000) * 1000)

  // Buying again while still Pro stacks the new period after the current one ends.
  const { data: latest } = await db
    .from('purchases').select('period_end').eq('user_id', userId).is('refunded_at', null).order('period_end', { ascending: false }).limit(1).maybeSingle()
  const latestEnd = latest ? new Date(latest.period_end) : null
  const base = latestEnd && latestEnd > paidAt ? latestEnd : paidAt
  const periodEnd = addPeriod(base, interval)

  // ON CONFLICT DO NOTHING on payment id: if checkout-verify and the webhook race, exactly one wins.
  const { data: inserted, error } = await db
    .from('purchases')
    .upsert(
      {
        user_id: userId,
        razorpay_order_id: payment.order_id,
        razorpay_payment_id: payment.id,
        plan_interval: interval,
        amount_paise: payment.amount,
        payment_method: payment.method ?? null,
        paid_at: paidAt.toISOString(),
        period_end: periodEnd.toISOString(),
      },
      { onConflict: 'razorpay_payment_id', ignoreDuplicates: true },
    )
    .select('id')
  if (error) {
    console.error('Supabase write failed:', error)
    throw new BillingError(500, `Database error: ${error.message}`)
  }

  const isNew = (inserted?.length ?? 0) > 0
  if (isNew) {
    // Emails go out before we respond: serverless functions may be frozen once the response is sent.
    await sendPaymentEmails({ userId, interval, payment, orderId: payment.order_id, paidAt, periodEnd, isRenewal: !!latest })
  }
  return { periodEnd: periodEnd.toISOString(), interval, alreadyRecorded: !isNew }
}

// ── Public API ──────────────────────────────────────────────────────────────
export async function createOrder(authHeader: string | undefined, requested: Interval) {
  const interval: Interval = requested === 'annual' ? 'annual' : 'monthly'
  const user = await authenticate(authHeader)

  const order = await rzp('/orders', {
    method: 'POST',
    body: {
      amount: PRICES_PAISE[interval],
      currency: 'INR',
      receipt: `je_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, interval },
    },
  })
  return { orderId: order.id as string, keyId: rzpCredentials().id, email: user.email }
}

export async function verifyPayment(
  authHeader: string | undefined,
  body: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string },
) {
  const user = await authenticate(authHeader)
  const { razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature } = body
  if (!paymentId || !orderId || !signature) throw new BillingError(400, 'Missing payment details.')

  const expected = hmac(rzpCredentials().secret, `${orderId}|${paymentId}`)
  if (!safeEqual(expected, signature)) throw new BillingError(400, 'Payment verification failed.')

  const result = await fulfilPayment(paymentId, user.id)
  return { status: 'paid', periodEnd: result.periodEnd }
}

export async function handleWebhook(rawBody: string, signature: string | undefined) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) throw new BillingError(503, 'Webhook secret is not configured.')
  if (!signature || !safeEqual(hmac(secret, rawBody), signature)) throw new BillingError(400, 'Invalid signature.')

  const event = JSON.parse(rawBody)
  const paymentId: string | undefined = event?.payload?.payment?.entity?.id
  if (event.event !== 'payment.captured' || !paymentId) return { received: true, ignored: true }

  try {
    await fulfilPayment(paymentId)
  } catch (e) {
    // A payment that isn't ours (or is malformed) will never succeed on retry: acknowledge it.
    if (e instanceof BillingError && e.status < 500) {
      console.warn('Webhook payment ignored:', paymentId, e.message)
      return { received: true, ignored: true }
    }
    throw e
  }
  return { received: true }
}

const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/**
 * "Cancel & refund": the Refund Policy promise, automated. Allowed once per customer, on their first
 * payment only, within 7 days. The refund goes back to the original payment method and Pro ends now.
 */
export async function cancelAndRefund(authHeader: string | undefined) {
  const user = await authenticate(authHeader)
  const db = admin()

  const { data: rows, error } = await db
    .from('purchases')
    .select('id, razorpay_payment_id, amount_paise, plan_interval, paid_at, refunded_at')
    .eq('user_id', user.id)
    .order('paid_at', { ascending: true })
  if (error) throw new BillingError(500, `Database error: ${error.message}`)

  const purchases = rows ?? []
  if (!purchases.length) throw new BillingError(404, 'You have no Pro purchase to cancel.')
  if (purchases.length > 1 || purchases[0].refunded_at) {
    throw new BillingError(400, 'Cancel & refund is only available for your first payment. Your pass will simply end on its date.')
  }
  const first = purchases[0]
  if (Date.now() - new Date(first.paid_at).getTime() > REFUND_WINDOW_MS) {
    throw new BillingError(400, 'The 7-day refund window has passed. Your pass will simply end on its date and will not renew.')
  }

  // Claim first, so a double click can never trigger two refunds.
  const { data: claimed } = await db
    .from('purchases').update({ refunded_at: new Date().toISOString() }).eq('id', first.id).is('refunded_at', null).select('id')
  if (!claimed?.length) throw new BillingError(409, 'This payment has already been cancelled.')

  let refund: any
  try {
    refund = await rzp(`/payments/${first.razorpay_payment_id}/refund`, {
      method: 'POST',
      body: { amount: first.amount_paise, speed: 'normal', notes: { reason: 'Customer cancelled within 7 days', user_id: user.id } },
    })
  } catch (e) {
    await db.from('purchases').update({ refunded_at: null }).eq('id', first.id) // nothing was refunded: restore access
    throw e
  }
  await db.from('purchases').update({ razorpay_refund_id: refund.id }).eq('id', first.id)

  // Never fail a refund that already happened because of an email problem.
  try {
    const { data: userRes } = await db.auth.admin.getUserById(user.id)
    const authUser = userRes?.user
    if (authUser?.email) {
      const { data: profile } = await db.from('profiles').select('name').eq('id', user.id).maybeSingle()
      const name: string = profile?.name || (authUser.user_metadata?.name as string) || ''
      const data = { firstName: name.split(' ')[0] || 'there', amountRupees: first.amount_paise / 100, paymentId: first.razorpay_payment_id as string }
      await sendBrandedMail(authUser.email, refundEmail(data))
      if (process.env.GMAIL_USER) {
        await sendBrandedMail(process.env.GMAIL_USER, ownerRefundNoticeEmail({ ...data, customerName: name, customerEmail: authUser.email }))
          .catch(e => console.error('Owner refund notice failed:', e))
      }
    }
  } catch (e) {
    console.error('Refund email failed:', e)
  }

  return { refunded: true, amountRupees: first.amount_paise / 100 }
}
