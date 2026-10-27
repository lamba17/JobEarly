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
 * Which currency to show prices in. Starts with a timezone guess (instant, so there is no flash), then
 * the server confirms from the visitor's country. The server also decides what is actually charged,
 * so what is shown and what is billed always agree. Server-side (prerender) it is always rupees.
 */
export function useCurrency(): Currency {
  const [currency, setCurrency] = useState<Currency>(() => (typeof window === 'undefined' ? 'INR' : cached() ?? guessCurrency()))

  useEffect(() => {
    let cancelled = false
    fetch('/api/pricing')
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (cancelled || !j || (j.currency !== 'INR' && j.currency !== 'USD')) return
        setCurrency(j.currency)
        try { sessionStorage.setItem(CACHE_KEY, j.currency) } catch { /* storage blocked: fine */ }
      })
      .catch(() => { /* keep the guess */ })
    return () => { cancelled = true }
  }, [])

  return currency
}
