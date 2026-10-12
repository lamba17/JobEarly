import { IconSparkle } from '../../icons'

const PRO_SCREENS = ['Cover Letters', 'Job Tracker', 'Analytics', 'Outreach']

/** Shown when a free user opens a Pro-only screen. */
export default function ProLockedModal({ feature, onClose, onUpgrade }: {
  feature: string
  onClose: () => void
  onUpgrade: () => void
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16,
        width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', padding: '26px 26px 22px', textAlign: 'center',
      }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--blue-50)', color: 'var(--accent)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 8 }}>
          <IconSparkle size={12} /> PRO FEATURE
        </div>
        <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>{feature} is locked</div>
        <p style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-soft)' }}>
          To unlock, please upgrade to the Pro version.
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-mute)' }}>
          Pro unlocks {PRO_SCREENS.join(', ')} and unlimited AI tailoring.
        </p>
        <button onClick={onUpgrade} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 14 }}>
          Upgrade to Pro
        </button>
        <button onClick={onClose} style={{ width: '100%', marginTop: 8, padding: '10px 0', background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          Maybe later
        </button>
      </div>
    </div>
  )
}
