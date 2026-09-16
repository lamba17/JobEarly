import { useState } from 'react'
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
  const [annual, setAnnual] = useState(true)
  const price = annual ? '₹299' : '₹599'

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
            <span style={{ fontSize: 13, color: 'var(--text-mute)' }}>/ month{annual ? ', billed yearly' : ''}</span>
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
          <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--text-mute)', marginBottom: 14, lineHeight: 1.5 }}>
            Pro billing isn't live yet — request early access below and we'll email you the moment it opens up.
          </div>
          <a
            href="mailto:hello@jobearly.ai?subject=Pro%20upgrade%20request&body=Hi%20JobEarly%20team%2C%0A%0AI'd%20like%20to%20upgrade%20to%20Pro%20as%20soon%20as%20it's%20available."
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 14 }}
          >
            Request Early Access
          </a>
          <button onClick={onClose} style={{ width: '100%', marginTop: 8, padding: '10px 0', background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
