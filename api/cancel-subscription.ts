import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BillingError, cancelSubscription } from './_lib/billing.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    res.status(200).json(await cancelSubscription(req.headers.authorization))
  } catch (e: any) {
    res.status(e instanceof BillingError ? e.status : 500).json({ error: e.message || 'Could not cancel subscription' })
  }
}
