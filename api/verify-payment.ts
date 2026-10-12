import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BillingError, verifyPayment } from './_lib/billing.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    res.status(200).json(await verifyPayment(req.headers.authorization, req.body ?? {}))
  } catch (e: any) {
    res.status(e instanceof BillingError ? e.status : 500).json({ error: e.message || 'Could not verify payment' })
  }
}
