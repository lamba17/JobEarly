// The Pro plans and what they cost, as the customer sees them. The server keeps its own copy of the
// prices in api/_lib/billing.ts (in the smallest currency unit) and is the one that decides what is charged.
export type Interval = 'monthly' | 'quarterly' | 'annual'
export type Currency = 'INR' | 'USD'

/** Whole currency units (rupees / dollars). India pays in INR, everywhere else in USD. */
export const PRICES: Record<Currency, Record<Interval, number>> = {
  INR: { monthly: 199, quarterly: 449, annual: 1188 },
  USD: { monthly: 9,   quarterly: 24,  annual: 79 },
}

export interface PlanInfo {
  label: string
  /** "Your ___ pass is active until…" */
  pass: string
  months: number
  /** "₹449 / 3 months" */
  period: string
}

export const PLANS: Record<Interval, PlanInfo> = {
  monthly:   { label: 'Monthly',   pass: 'one-month',   months: 1,  period: 'month' },
  quarterly: { label: 'Quarterly', pass: 'three-month', months: 3,  period: '3 months' },
  annual:    { label: 'Annual',    pass: 'one-year',    months: 12, period: 'year' },
}

// Plans offered for sale. 'annual' stays in the table above so existing yearly passes still display and work,
// but it is no longer offered to new customers (the server refuses new yearly orders too).
export const PLAN_ORDER: Interval[] = ['monthly', 'quarterly']

export const priceOf = (plan: Interval, currency: Currency) => PRICES[currency][plan]

/** Per-month equivalent: whole rupees, or dollars and cents. */
export function perMonthOf(plan: Interval, currency: Currency): number {
  const exact = PRICES[currency][plan] / PLANS[plan].months
  return currency === 'INR' ? Math.round(exact) : Math.round(exact * 100) / 100
}

/** Percentage saved versus paying month by month, or null for the monthly plan itself. */
export function savePct(plan: Interval, currency: Currency): number | null {
  if (plan === 'monthly') return null
  const exact = PRICES[currency][plan] / PLANS[plan].months
  return Math.round((1 - exact / PRICES[currency].monthly) * 100)
}

export function money(amount: number, currency: Currency): string {
  if (currency === 'INR') return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })}`
}

export const monthsLabel = (months: number) => (months === 12 ? '1 year' : months === 1 ? '1 month' : `${months} months`)

/** Falls back to monthly for an unknown value, so old or odd rows never break a screen. */
export function planInfo(interval: string | undefined): PlanInfo {
  return PLANS[(interval as Interval) in PLANS ? (interval as Interval) : 'monthly']
}

/** Same rule the server uses: India pays in rupees, everywhere else in dollars. Unknown → rupees. */
export function currencyForCountry(country?: string | null): Currency {
  return country && country.toUpperCase() !== 'IN' ? 'USD' : 'INR'
}

/** An instant, no-network guess from the browser's timezone, used until the server confirms the country. */
export function guessCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta' ? 'INR' : 'USD'
  } catch {
    return 'INR'
  }
}
