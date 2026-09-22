import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconRocket, IconArrowRight, IconCheck } from '../icons'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await requestPasswordReset(email)
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-mark"><IconRocket size={16} stroke={2.4} /></span>
          <span>JobEarly</span>
        </div>

        {!sent ? (
          <>
            <h1>Reset your password</h1>
            <p className="sub">Enter the email on your account and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" className="form-input" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Sending…' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Send Reset Link <IconArrowRight size={15} /></span>}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ECFDF5', color: '#16A34A', display: 'grid', placeItems: 'center', marginBottom: 18 }}>
              <IconCheck size={20} />
            </div>
            <h1>Check your email</h1>
            <p className="sub">If an account exists for <b>{email}</b>, we've sent a link to reset your password.</p>
          </>
        )}

        <div className="auth-footer" style={{ marginTop: 8 }}>
          <Link to="/signin" style={{ color: 'var(--text-mute)' }}>← Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
