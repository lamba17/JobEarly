import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { IconCheck } from '../../icons'
import UpgradeModal from '../../components/app/UpgradeModal'
import { useSubscription } from '../../hooks/useSubscription'
import { cancelAndRefund } from '../../lib/billing'

export default function Settings() {
  const { user, updateProfile, changePassword } = useAuth()
  const location = useLocation()

  // "Manage plan" in the sidebar links to /app/settings#plan: bring the plan card into view,
  // even when the user is already on this page (location.key changes on every navigation).
  useEffect(() => {
    if (location.hash !== '#plan') return
    document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.key, location.hash])
  const { subscription, isPro } = useSubscription(user?.id)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [planMsg, setPlanMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const refundUntil = subscription?.refundableUntil ? fmt(subscription.refundableUntil) : null
  const paidAmount = subscription?.plan_interval === 'annual' ? '₹1,188' : '₹199'

  const handleCancel = async () => {
    if (!window.confirm(`Cancel JobEarly Pro and get a full refund of ${paidAmount}?\n\nYour Pro access will end immediately.`)) return
    setCancelling(true)
    setPlanMsg(null)
    try {
      await cancelAndRefund()
      setPlanMsg({ type: 'ok', text: `Cancelled. Your refund of ${paidAmount} is on its way — it usually reaches you in 5–7 business days.` })
    } catch (e: any) {
      setPlanMsg({ type: 'err', text: e.message || 'Could not cancel. Please try again.' })
    } finally {
      setCancelling(false)
    }
  }

  const planName = subscription?.plan_interval === 'annual' ? 'one-year' : 'one-month'

  const [name, setName] = useState(user?.name ?? '')
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? '')
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setProfileMsg({ type: 'err', text: 'Full name is required.' }); return }
    const err = await updateProfile({ name: name.trim(), jobTitle: jobTitle.trim() })
    if (err) { setProfileMsg({ type: 'err', text: err }); return }
    setProfileMsg({ type: 'ok', text: 'Profile updated.' })
    setTimeout(() => setProfileMsg(null), 2500)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setPasswordMsg({ type: 'err', text: 'New passwords do not match.' }); return }
    const err = await changePassword(currentPassword, newPassword)
    if (err) { setPasswordMsg({ type: 'err', text: err }); return }
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    setPasswordMsg({ type: 'ok', text: 'Password updated.' })
    setTimeout(() => setPasswordMsg(null), 2500)
  }

  return (
    <>
      <div className="jm-header">
        <h1>Account <em>Settings</em></h1>
        <p>Manage your plan, profile information and password.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
        {/* Plan */}
        <div className="perf-card" id="plan" style={{ scrollMarginTop: 90 }}>
          <div className="perf-card-title">Your Plan</div>
          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>
            <strong>{isPro ? 'JobEarly Pro' : 'Free'}</strong>
            {isPro && subscription && <span style={{ color: 'var(--text-mute)' }}> · {subscription.plan_interval === 'annual' ? '₹1,188 · 1 year' : '₹199 · 1 month'}</span>}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginBottom: 14, lineHeight: 1.5 }}>
            {isPro && periodEnd && `Your ${planName} pass is active until ${periodEnd}. It won't renew automatically, so you won't be charged again. Extend any time to keep Pro going — the new period is added after this one.`}
            {!isPro && subscription && periodEnd && `Your Pro access ended on ${periodEnd}. Upgrade to continue with unlimited tailoring.`}
            {!isPro && !subscription && '1 AI-tailored resume per month. Upgrade for unlimited tailoring, cover letters and outreach.'}
          </div>
          {isPro && refundUntil && (
            <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginBottom: 14, lineHeight: 1.5 }}>
              Changed your mind? Cancel before <strong>{refundUntil}</strong> for a full refund — your Pro access then ends right away.
            </div>
          )}
          {planMsg && (
            <div style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.5, color: planMsg.type === 'ok' ? '#16A34A' : '#DC2626' }}>{planMsg.text}</div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isPro && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowUpgrade(true)}>Extend Pro</button>
            )}
            {isPro && refundUntil && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Cancel & refund'}
              </button>
            )}
            {!isPro && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowUpgrade(true)}>Upgrade to Pro</button>
            )}
          </div>
        </div>

        {/* Profile */}
        <form className="perf-card" onSubmit={handleSaveProfile}>
          <div className="perf-card-title">Profile Information</div>
          <div className="form-group">
            <label htmlFor="settings-name">Full Name</label>
            <input id="settings-name" className="form-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="settings-email">Email</label>
            <input id="settings-email" className="form-input" value={user?.email ?? ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label htmlFor="settings-role">Current Role</label>
            <input id="settings-role" className="form-input" placeholder="e.g. Product Designer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
          </div>

          {profileMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, marginBottom: 12,
              color: profileMsg.type === 'ok' ? '#16A34A' : '#DC2626',
            }}>
              {profileMsg.type === 'ok' && <IconCheck size={12} />} {profileMsg.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
        </form>

        {/* Password */}
        <form className="perf-card" onSubmit={handleChangePassword}>
          <div className="perf-card-title">Change Password</div>
          <div className="form-group">
            <label htmlFor="current-password">Current Password</label>
            <input id="current-password" type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input id="new-password" type="password" className="form-input" placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input id="confirm-password" type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
          </div>

          {passwordMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, marginBottom: 12,
              color: passwordMsg.type === 'ok' ? '#16A34A' : '#DC2626',
            }}>
              {passwordMsg.type === 'ok' && <IconCheck size={12} />} {passwordMsg.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-sm">Update Password</button>
        </form>
      </div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  )
}
