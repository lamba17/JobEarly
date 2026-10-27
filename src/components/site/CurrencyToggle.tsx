import type { Currency } from '../../lib/plans'

/** ₹ / $ switch, shown only to visitors in India (everyone else can only pay in dollars). */
export default function CurrencyToggle({ currency, onChange }: { currency: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="cur-toggle" role="group" aria-label="Currency">
      <button type="button" className={currency === 'INR' ? 'active' : ''} onClick={() => onChange('INR')}>₹ INR</button>
      <button type="button" className={currency === 'USD' ? 'active' : ''} onClick={() => onChange('USD')}>$ USD</button>
    </div>
  )
}
