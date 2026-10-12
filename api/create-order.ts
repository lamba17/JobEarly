import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BillingError, createOrder } from './_lib/billing.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const interval = req.body?.interval === 'annual' ? 'annual' : 'monthly'
    res.status(200).json(await createOrder(req.headers.authorization, interval))
  } catch (e: any) {
    res.status(e instanceof BillingError ? e.status : 500).json({ error: e.message || 'Could not start checkout' })
  }
}
