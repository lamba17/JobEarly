import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconRocket, IconArrowRight } from '../icons'

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = signIn(email, password)
    setLoading(false)
    if (err) { setError(err); return }
    navigate('/app/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-mark"><IconRocket size={16} stroke={2.4} /></span>
          <span>JobEarly</span>
        </div>
        <h1>Welcome back</h1>
        <p className="sub">Sign in to your account to continue.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email" type="email" className="form-input"
              placeholder="you@example.com" required
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password" type="password" className="form-input"
              placeholder="••••••••" required
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Sign in <IconArrowRight size={15} /></span>}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up free</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: 8 }}>
          <Link to="/" style={{ color: 'var(--text-mute)' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
