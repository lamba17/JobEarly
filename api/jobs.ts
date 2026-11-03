import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BillingError } from './_lib/billing.js'
import { findJobs, requirePro } from './_lib/jobsHandler.js'

// GET /api/jobs?mode=local|remote&q=&where=&country=&page=
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await requirePro(req.headers.authorization)
    const one = (v: unknown) => (Array.isArray(v) ? String(v[0] ?? '') : String(v ?? ''))
    res.setHeader('Cache-Control', 'private, no-store')
    res.status(200).json(await findJobs({
      mode: one(req.query.mode), q: one(req.query.q), company: one(req.query.company), where: one(req.query.where),
      country: one(req.query.country), page: one(req.query.page), distance: one(req.query.distance),
    }))
  } catch (error: any) {
    if (!(error instanceof BillingError)) console.error('Jobs error:', error)
    res.status(error instanceof BillingError ? error.status : 500).json({ error: error.message || 'Job search failed' })
  }
}
