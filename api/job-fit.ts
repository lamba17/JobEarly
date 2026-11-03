import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BillingError } from './_lib/billing.js'
import { scoreJobFit } from './_lib/jobFit.js'

// POST /api/job-fit  { resumeText, job: { title, company, description } }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    res.status(200).json(await scoreJobFit(req.headers.authorization, req.body))
  } catch (error: any) {
    if (!(error instanceof BillingError)) console.error('Job fit error:', error)
    res.status(error instanceof BillingError ? error.status : 500).json({ error: error.message || 'Scoring failed' })
  }
}
