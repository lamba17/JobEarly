import type { VercelRequest, VercelResponse } from '@vercel/node'
import { currencyForCountry } from './_lib/billing.js'

// Tells the browser which currency to show prices in, from the visitor's country (set by Vercel's edge).
// The server makes the same decision again when an order is created, so display and billing agree.
export default function handler(req: VercelRequest, res: VercelResponse) {
  const country = (req.headers['x-vercel-ip-country'] as string | undefined) ?? null
  res.setHeader('Cache-Control', 'private, no-store')
  res.status(200).json({ country, currency: currencyForCountry(country) })
}
