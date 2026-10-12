// One-off: creates the JobEarly Pro plans in the Razorpay account whose keys are in .env
// and writes the resulting plan IDs back into .env. Safe to read: it never prints secrets.
//   node scripts/create-razorpay-plans.mjs
import 'dotenv/config'
import fs from 'node:fs'

const id = process.env.RAZORPAY_KEY_ID
const secret = process.env.RAZORPAY_KEY_SECRET
if (!id || !secret) {
  console.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing from .env')
  process.exit(1)
}
console.log(`Mode: ${id.startsWith('rzp_live_') ? 'LIVE' : 'TEST'}`)

const existing = ['RAZORPAY_PLAN_MONTHLY', 'RAZORPAY_PLAN_ANNUAL'].filter(k => process.env[k])
if (existing.length) {
  console.error(`Already set in .env: ${existing.join(', ')}. Remove them first if you really want new plans.`)
  process.exit(1)
}

async function createPlan({ period, name, amountRupees }) {
  const res = await fetch('https://api.razorpay.com/v1/plans', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      period,
      interval: 1,
      item: { name, amount: amountRupees * 100, currency: 'INR', description: name },
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`${name}: ${json?.error?.description || res.status}`)
  return json.id
}

const monthly = await createPlan({ period: 'monthly', name: 'JobEarly Pro - Monthly', amountRupees: 199 })
const annual = await createPlan({ period: 'yearly', name: 'JobEarly Pro - Annual', amountRupees: 1188 })

fs.appendFileSync('.env', `\n# Razorpay plan IDs (not secret)\nRAZORPAY_PLAN_MONTHLY=${monthly}\nRAZORPAY_PLAN_ANNUAL=${annual}\n`)
console.log('RAZORPAY_PLAN_MONTHLY =', monthly)
console.log('RAZORPAY_PLAN_ANNUAL  =', annual)
console.log('Saved to .env. Add the same two variables in Vercel too.')
