import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconRocket, IconArrowRight, IconCheck } from '../icons'

export default function ForgotPassword() {
  const { findAccount, resetPassword } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleFindAccount = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!findAccount(email)) { setError('No account found with that email.'); return }
    setStep('reset')
  }

  const handleReset = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    const err = resetPassword(email, newPassword)
    if (err) { setError(err); return }
    setStep('done')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-mark"><IconRocket size={16} stroke={2.4} /></span>
          <span>JobEarly</span>
        </div>

        {step === 'email' && (
          <>
            <h1>Reset your password</h1>
            <p className="sub">Enter the email on your account and we'll get you back in.</p>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleFindAccount}>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" className="form-input" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="auth-submit">
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Continue <IconArrowRight size={15} /></span>
              </button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <h1>Set a new password</h1>
            <p className="sub">
              We found your account. Since JobEarly doesn't send reset emails yet, you can set a new password directly below.
            </p>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label htmlFor="new-password">New password</label>
                <input id="new-password" type="password" className="form-input" placeholder="Min. 6 characters" required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input id="confirm-password" type="password" className="form-input" placeholder="Repeat password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <button type="submit" className="auth-submit">Reset Password</button>
            </form>
          </>
        )}

        {step === 'done' && (
          <>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ECFDF5', color: '#16A34A', display: 'grid', placeItems: 'center', marginBottom: 18 }}>
              <IconCheck size={20} />
            </div>
            <h1>Password updated</h1>
            <p className="sub">You can now sign in with your new password.</p>
            <button className="auth-submit" onClick={() => navigate('/signin')}>Go to Sign In</button>
          </>
        )}

        <div className="auth-footer" style={{ marginTop: 8 }}>
          <Link to="/signin" style={{ color: 'var(--text-mute)' }}>← Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
