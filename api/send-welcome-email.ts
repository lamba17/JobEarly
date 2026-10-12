import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendBrandedMail, mailerConfigured } from './_lib/mailer.js'
import { welcomeEmail } from './_lib/emailTemplates.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, name } = (req.body ?? {}) as { email?: string; name?: string }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  if (!mailerConfigured()) {
    console.warn('Welcome email skipped: GMAIL_USER / GMAIL_APP_PASSWORD not configured')
    return res.status(200).json({ sent: false })
  }

  try {
    const firstName = (name || '').split(' ')[0] || 'there'
    await sendBrandedMail(email, welcomeEmail({ firstName }))
    res.status(200).json({ sent: true })
  } catch (error: any) {
    console.error('Error sending welcome email:', error)
    res.status(500).json({ error: error?.message || 'Failed to send welcome email' })
  }
}
