import { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, name } = req.body as { email: string; name?: string }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPassword) {
    console.warn('Welcome email skipped: GMAIL_USER / GMAIL_APP_PASSWORD not configured')
    return res.status(200).json({ sent: false })
  }

  try {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPassword },
    })

    const firstName = (name || '').split(' ')[0] || 'there'

    await transport.sendMail({
      from: `"JobEarly" <${gmailUser}>`,
      to: email,
      subject: 'Welcome to JobEarly!',
      text: `Hi ${firstName},\n\nThank you for signing up, and we look forward to you using JobEarly.\n\n— The JobEarly Team`,
      html: `<p>Hi ${firstName},</p><p>Thank you for signing up, and we look forward to you using JobEarly.</p><p>— The JobEarly Team</p>`,
    })

    res.status(200).json({ sent: true })
  } catch (error: any) {
    console.error('Error sending welcome email:', error)
    res.status(500).json({
      error: error?.message || 'Failed to send welcome email',
    })
  }
}
