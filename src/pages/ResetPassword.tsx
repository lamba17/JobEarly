import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { IconRocket, IconArrowRight, IconCheck } from '../icons'

export default function ResetPassword() {
  const { updatePasswordFromRecovery } = useAuth()
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // supabase-js exchanges the recovery token in the URL for a session automatically.
    // Wait for that session before showing the form.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    const err = await updatePasswordFromRecovery(newPassword)
    if (err) { setError(err); return }
    setDone(true)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-mark"><IconRocket size={16} stroke={2.4} /></span>
          <span>JobEarly</span>
        </div>

        {done ? (
          <>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ECFDF5', color: '#16A34A', display: 'grid', placeItems: 'center', marginBottom: 18 }}>
              <IconCheck size={20} />
            </div>
            <h1>Password updated</h1>
            <p className="sub">Your password has been changed.</p>
            <button className="auth-submit" onClick={() => navigate('/app/dashboard')}>Go to Dashboard</button>
          </>
        ) : !ready ? (
          <>
            <h1>Reset your password</h1>
            <p className="sub">Verifying your reset link…</p>
          </>
        ) : (
          <>
            <h1>Set a new password</h1>
            <p className="sub">Choose a new password for your account.</p>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="new-password">New password</label>
                <input id="new-password" type="password" className="form-input" placeholder="Min. 6 characters" required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input id="confirm-password" type="password" className="form-input" placeholder="Repeat password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <button type="submit" className="auth-submit">
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Reset Password <IconArrowRight size={15} /></span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
