import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import UpgradeModal from '../../components/app/UpgradeModal'
import ProLockedModal from '../../components/app/ProLockedModal'
import { useSubscription } from '../../hooks/useSubscription'
import {
  IconRocket, IconDoc, IconFeather, IconBriefcase, IconChart, IconSend,
  IconHelp, IconSettings, IconLogOut, IconSun, IconMoon, IconArrowRight,
} from '../../icons'

function SidebarItem({ to, icon, label, locked, onLocked }: {
  to: string; icon: React.ReactNode; label: string; locked?: boolean; onLocked?: () => void
}) {
  // Pro-only screens stay visible to free users; clicking one explains what Pro unlocks.
  if (locked) {
    return (
      <button type="button" className="sidebar-nav-item sidebar-nav-locked" onClick={onLocked}>
        {icon}{label}
        <svg style={{ marginLeft: 'auto', opacity: 0.6 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-label="Pro feature">
          <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </button>
    )
  }
  return (
    <NavLink to={to} className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
      {icon}{label}
    </NavLink>
  )
}

export default function AppLayout({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const { isPro, loading: planLoading } = useSubscription(user?.id)
  const locked = !isPro && !planLoading
  const [lockedFeature, setLockedFeature] = useState<string | null>(null)
  const location = useLocation()

  // A free user who typed a Pro-only URL is redirected here with the feature name in router state.
  useEffect(() => {
    const feature = (location.state as { proLocked?: string } | null)?.proLocked
    if (!feature) return
    setLockedFeature(feature)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  // On phones the sidebar is a slide-in drawer: close it after navigating or on Escape
  useEffect(() => { setNavOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navOpen])

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <div className="app-wrap">
      {/* ── Sidebar ─────────────────────────── */}
      {navOpen && <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} aria-hidden="true" />}
      <aside className={`app-sidebar${navOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <span className="brand-mark"><IconRocket size={14} stroke={2.4} /></span>
          <span>JobEarly</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="name">{user?.name ?? 'User'}</div>
            <div className="badge-ea">EARLY ACCESS</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <SidebarItem to="/app/dashboard"     icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>} label="Dashboard" />
          <SidebarItem to="/app/resume-builder" icon={<IconDoc size={15} />}       label="Resumes" />
          <SidebarItem to="/app/cover-letter"   icon={<IconFeather size={15} />}   label="Cover Letters" locked={locked} onLocked={() => setLockedFeature('Cover Letters')} />
          <SidebarItem to="/app/job-match"      icon={<IconBriefcase size={15} />} label="Job Tracker" locked={locked} onLocked={() => setLockedFeature('Job Tracker')} />
          <SidebarItem to="/app/performance"    icon={<IconChart size={15} />}     label="Analytics" locked={locked} onLocked={() => setLockedFeature('Analytics')} />
          <SidebarItem to="/app/outreach"       icon={<IconSend size={15} />}      label="Outreach" locked={locked} onLocked={() => setLockedFeature('Outreach')} />

          <div className="sidebar-divider" />

          <SidebarItem to="/app/help"     icon={<IconHelp size={15} />}     label="Help Center" />
          <SidebarItem to="/app/settings" icon={<IconSettings size={15} />} label="Settings" />
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-upgrade">
            <div className="upg-label">{isPro ? 'PRO PLAN ✓' : 'PRO PLAN'}</div>
            <div className="upg-text">{isPro ? "You're on Pro — unlimited AI tailoring is unlocked." : 'Unlock cover letters, job tracker, analytics, outreach & unlimited tailoring.'}</div>
            {isPro
              ? <button className="upg-btn" onClick={() => navigate('/app/settings#plan')}>Manage plan</button>
              : <button className="upg-btn" onClick={() => setShowUpgrade(true)}>Upgrade to Pro</button>}
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────── */}
      <div className="app-content">
        {/* Top nav */}
        <header className="app-topnav">
          <div className="app-topnav-left">
            <button
              type="button"
              className="app-menu-btn"
              onClick={() => setNavOpen(v => !v)}
              aria-label="Open menu"
              aria-expanded={navOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <NavLink to="/app/dashboard"      className={({ isActive }) => `app-tab${isActive ? ' active' : ''}`}>Dashboard</NavLink>
            <NavLink to="/app/resume-builder" className={({ isActive }) => `app-tab${isActive ? ' active' : ''}`}>Resume Builder</NavLink>
            <NavLink to="/app/cover-letter"   className={({ isActive }) => `app-tab${isActive ? ' active' : ''}`}>Cover Letters</NavLink>
            <NavLink to="/app/job-match"      className={({ isActive }) => `app-tab${isActive ? ' active' : ''}`}>Job Tracker</NavLink>
            <NavLink to="/app/performance"    className={({ isActive }) => `app-tab${isActive ? ' active' : ''}`}>Analytics</NavLink>
            <NavLink to="/app/outreach"       className={({ isActive }) => `app-tab${isActive ? ' active' : ''}`}>Outreach</NavLink>
          </div>
          <div className="app-topnav-right">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" style={{ width: 34, height: 34 }}>
              {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
            </button>
            <NavLink to="/app/resume-builder" className="btn btn-primary btn-sm">
              Build Resume <IconArrowRight size={13} />
            </NavLink>
            <div className="app-avatar-wrap" ref={menuRef}>
              <button
                className="app-avatar"
                style={{ border: 'none' }}
                onClick={() => setMenuOpen(v => !v)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                {initials}
              </button>
              {menuOpen && (
                <div className="app-avatar-menu">
                  <div className="app-avatar-menu-header">
                    <div className="name">{user?.name ?? 'User'}</div>
                    <div className="email">{user?.email ?? ''}</div>
                  </div>
                  <NavLink to="/app/settings" className="app-avatar-menu-item" onClick={() => setMenuOpen(false)}>
                    <IconSettings size={15} /> Settings
                  </NavLink>
                  <button onClick={handleSignOut} className="app-avatar-menu-item danger">
                    <IconLogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {lockedFeature && (
        <ProLockedModal
          feature={lockedFeature}
          onClose={() => setLockedFeature(null)}
          onUpgrade={() => { setLockedFeature(null); setShowUpgrade(true) }}
        />
      )}
    </div>
  )
}
