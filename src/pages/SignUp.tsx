import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconRocket, IconArrowRight } from '../icons'

export default function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', jobTitle: '', password: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const err = signUp({ name: form.name, email: form.email, jobTitle: form.jobTitle, password: form.password })
    setLoading(false)
    if (err) { setError(err); return }
    navigate('/app/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo">
          <span className="brand-mark"><IconRocket size={16} stroke={2.4} /></span>
          <span>JobEarly</span>
        </div>
        <h1>Create your account</h1>
        <p className="sub">Start for free — no credit card required.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input id="name" type="text" className="form-input" placeholder="Alex Thorne" required value={form.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label htmlFor="jobTitle">Current / target role</label>
              <input id="jobTitle" type="text" className="form-input" placeholder="Product Designer" required value={form.jobTitle} onChange={set('jobTitle')} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" className="form-input" placeholder="you@example.com" required value={form.email} onChange={set('email')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="form-input" placeholder="Min. 6 characters" required value={form.password} onChange={set('password')} />
            </div>
            <div className="form-group">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" className="form-input" placeholder="Repeat password" required value={form.confirm} onChange={set('confirm')} />
            </div>
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Create free account <IconArrowRight size={15} /></span>}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-mute)', textAlign: 'center', marginTop: 12 }}>
          By signing up, you agree to our <a href="#" style={{ color: 'var(--accent)' }}>Terms</a> and <a href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.
        </p>
        <div className="auth-footer">
          Already have an account? <Link to="/signin">Sign in</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: 8 }}>
          <Link to="/" style={{ color: 'var(--text-mute)' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
