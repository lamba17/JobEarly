import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { startCheckout } from '../../lib/billing'
import { IconCheck, IconSparkle } from '../../icons'

const PRO_FEATURES = [
  'Unlimited AI-tailored resumes',
  'Advanced ATS readiness audits',
  'Unlimited cover letters',
  'Smart Outreach with reply tracking',
  'Performance analytics + insights',
  'Priority human + AI support',
]

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { isPro } = useSubscription(user?.id)
  const [annual, setAnnual] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const price = annual ? '₹99' : '₹199'

  const handleUpgrade = async () => {
    if (!user) return
    setError(null)
    setBusy(true)
    try {
      const result = await startCheckout(annual ? 'annual' : 'monthly', { name: user.name, email: user.email })
      if (result === 'paid') setDone(true)
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16,
        width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 8 }}>
              <IconSparkle size={12} /> JOBEARLY PRO
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>Unlock unlimited tailoring</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'grid', placeItems: 'center', width: 28, height: 28, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Price toggle */}
        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{price}</span>
            <span style={{ fontSize: 13, color: 'var(--text-mute)' }}>/ month{annual ? ', billed yearly' : ' · one month, no auto-renewal'}</span>
          </div>
          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 20, padding: 3, gap: 2 }}>
            {(['annual', 'monthly'] as const).map(k => (
              <button
                key={k}
                onClick={() => setAnnual(k === 'annual')}
                style={{
                  padding: '5px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 12, fontWeight: 700,
                  background: (annual ? k === 'annual' : k === 'monthly') ? 'var(--accent)' : 'transparent',
                  color: (annual ? k === 'annual' : k === 'monthly') ? '#fff' : 'var(--text-mute)',
                }}
              >
                {k === 'annual' ? 'Annual · Save 50%' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 11 }}>
          {PRO_FEATURES.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--text)' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue-50)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <IconCheck size={10} />
              </span>
              {f}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: '24px', marginTop: 4 }}>
          {done || isPro ? (
            <>
              <div style={{ background: 'var(--blue-50)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 13.5, color: 'var(--text)', marginBottom: 14, lineHeight: 1.5 }}>
                {done ? "You're all set — welcome to JobEarly Pro!" : "You're already on JobEarly Pro."}
              </div>
              <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 14 }}>
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleUpgrade}
                disabled={busy}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 14, opacity: busy ? 0.7 : 1 }}
              >
                {busy ? 'Opening secure checkout…' : annual ? 'Upgrade — ₹1,188 / year' : 'Upgrade — ₹199 / month'}
              </button>
              {error && <div style={{ color: '#DC2626', fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>{error}</div>}
              <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
                Secure payment by Razorpay (UPI, cards, netbanking). Cancel anytime from Settings.
              </div>
              <button onClick={onClose} style={{ width: '100%', marginTop: 8, padding: '10px 0', background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                Maybe later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
