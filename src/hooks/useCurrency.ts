import { useEffect, useState } from 'react'
import { guessCurrency, type Currency } from '../lib/plans'

const CACHE_KEY = 'je-currency'

function cached(): Currency | null {
  try {
    const v = sessionStorage.getItem(CACHE_KEY)
    return v === 'INR' || v === 'USD' ? v : null
  } catch {
    return null
  }
}

/**
 * Which currency to show prices in.
 *  - `detected` starts as a timezone guess (instant, so no flash), then the server confirms from the visitor's country.
 *  - Visitors in India may also look at (and pay in) US dollars, so `canSwitch` is true for them. Everyone else
 *    sees and pays dollars only: the server will not sell rupee prices outside India.
 * Server-side (prerender) it is always rupees.
 */
export function useCurrency() {
  const [detected, setDetected] = useState<Currency>(() => (typeof window === 'undefined' ? 'INR' : cached() ?? guessCurrency()))
  const [choice, setChoice] = useState<Currency | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/pricing')
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (cancelled || !j || (j.currency !== 'INR' && j.currency !== 'USD')) return
        setDetected(j.currency)
        try { sessionStorage.setItem(CACHE_KEY, j.currency) } catch { /* storage blocked: fine */ }
      })
      .catch(() => { /* keep the guess */ })
    return () => { cancelled = true }
  }, [])

  const canSwitch = detected === 'INR'
  const currency: Currency = canSwitch && choice ? choice : detected
  return { currency, setCurrency: setChoice, canSwitch }
}
