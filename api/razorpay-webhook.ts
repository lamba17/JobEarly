import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BillingError, handleWebhook } from './_lib/billing.js'

// The signature is computed over the exact raw bytes, so disable body parsing.
export const config = { api: { bodyParser: false } }

async function readRaw(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks).toString('utf8')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const raw = await readRaw(req)
    res.status(200).json(await handleWebhook(raw, req.headers['x-razorpay-signature'] as string | undefined))
  } catch (e: any) {
    console.error('Razorpay webhook error:', e)
    res.status(e instanceof BillingError ? e.status : 500).json({ error: e.message || 'Webhook failed' })
  }
}
