import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { IconCheck } from '../../icons'

export default function Settings() {
  const { user, updateProfile, changePassword } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? '')
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setProfileMsg({ type: 'err', text: 'Full name is required.' }); return }
    updateProfile({ name: name.trim(), jobTitle: jobTitle.trim() })
    setProfileMsg({ type: 'ok', text: 'Profile updated.' })
    setTimeout(() => setProfileMsg(null), 2500)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setPasswordMsg({ type: 'err', text: 'New passwords do not match.' }); return }
    const err = changePassword(currentPassword, newPassword)
    if (err) { setPasswordMsg({ type: 'err', text: err }); return }
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    setPasswordMsg({ type: 'ok', text: 'Password updated.' })
    setTimeout(() => setPasswordMsg(null), 2500)
  }

  return (
    <>
      <div className="jm-header">
        <h1>Account <em>Settings</em></h1>
        <p>Manage your profile information and password.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
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
    </>
  )
}
