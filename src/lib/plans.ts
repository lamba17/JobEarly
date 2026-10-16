// The Pro plans, as the customer sees them. (The server keeps its own copy of the prices in
// api/_lib/billing.ts and is the one that actually decides what is charged.)
export type Interval = 'monthly' | 'quarterly' | 'annual'

export interface PlanInfo {
  label: string
  /** "Your ___ pass is active until…" */
  pass: string
  months: number
  price: number
  perMonth: number
  /** "₹449 / 3 months" */
  period: string
  save: string | null
}

export const PLANS: Record<Interval, PlanInfo> = {
  monthly:   { label: 'Monthly',   pass: 'one-month',   months: 1,  price: 199,  perMonth: 199, period: 'month',    save: null },
  quarterly: { label: 'Quarterly', pass: 'three-month', months: 3,  price: 449,  perMonth: 150, period: '3 months', save: 'Save 25%' },
  annual:    { label: 'Annual',    pass: 'one-year',    months: 12, price: 1188, perMonth: 99,  period: 'year',     save: 'Save 50%' },
}

export const PLAN_ORDER: Interval[] = ['monthly', 'quarterly', 'annual']

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`

/** Falls back to monthly for an unknown value, so old or odd rows never break a screen. */
export function planInfo(interval: string | undefined): PlanInfo {
  return PLANS[(interval as Interval) in PLANS ? (interval as Interval) : 'monthly']
}
