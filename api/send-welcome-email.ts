import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SignupEmailError, sendSignupEmails, sendSignupEmailsForSession } from './_lib/signup.js'

// Two callers, neither trusted (see api/_lib/signup.ts):
//  - the sign-up page, right after signUp, with { email }
//  - the app after sign-in, with the user's login token: a second chance if the first request was lost
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (req.headers.authorization) {
      return res.status(200).json(await sendSignupEmailsForSession(req.headers.authorization))
    }

    const { email } = (req.body ?? {}) as { email?: unknown }
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' })
    }
    res.status(200).json(await sendSignupEmails(email))
  } catch (error: any) {
    console.error('Signup email error:', error)
    res.status(error instanceof SignupEmailError ? error.status : 500).json({ error: error?.message || 'Failed to send signup emails' })
  }
}
