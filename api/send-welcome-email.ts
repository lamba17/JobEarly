import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendSignupEmails } from './_lib/signup.js'

// Fired by the browser right after sign-up. It does not trust the request: sendSignupEmails only acts
// for a real, brand-new account that has not been welcomed yet (see api/_lib/signup.ts).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = (req.body ?? {}) as { email?: unknown }
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    res.status(200).json(await sendSignupEmails(email))
  } catch (error: any) {
    console.error('Signup email error:', error)
    res.status(500).json({ error: error?.message || 'Failed to send signup emails' })
  }
}
