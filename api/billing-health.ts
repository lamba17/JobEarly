import type { VercelRequest, VercelResponse } from '@vercel/node'
import { billingHealth } from './_lib/billing.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json(await billingHealth())
}
