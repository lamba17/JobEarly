import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  IconRocket, IconDoc, IconBriefcase, IconChart, IconSend,
  IconHelp, IconSettings, IconLogOut, IconSun, IconMoon, IconArrowRight,
} from '../../icons'

function SidebarItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
      {icon}{label}
    </NavLink>
  )
}

export default function AppLayout({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="app-wrap">
      {/* ── Sidebar ─────────────────────────── */}
      <aside className="app-sidebar">
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
          <SidebarItem to="/app/job-match"      icon={<IconBriefcase size={15} />} label="Job Matches" />
          <SidebarItem to="/app/performance"    icon={<IconChart size={15} />}     label="Analytics" />
          <SidebarItem to="/app/outreach"       icon={<IconSend size={15} />}      label="Outreach" />

          <div className="sidebar-divider" />

          <SidebarItem to="/app/dashboard" icon={<IconHelp size={15} />}     label="Help Center" />
          <SidebarItem to="/app/dashboard" icon={<IconSettings size={15} />} label="Settings" />
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-upgrade">
            <div className="upg-label">PRO PLAN</div>
            <div className="upg-text">Unlock unlimited AI resume tailoring.</div>
            <button className="upg-btn">Upgrade to Pro</button>
          </div>
          <button
            onClick={handleSignOut}
            className="sidebar-nav-item"
            style={{ marginTop: 8, width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-mute)' }}
          >
            <IconLogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────── */}
      <div className="app-content">
        {/* Top nav */}
        <header className="app-topnav">
          <div className="app-topnav-left">
            <NavLink to="/app/dashboard"      className={({ isActive }) => `app-tab${isActive ? ' active' : ''}`}>Dashboard</NavLink>
            <NavLink to="/app/resume-builder" className={({ isActive }) => `app-tab${isActive ? ' active' : ''}`}>Resume Builder</NavLink>
            <NavLink to="/app/job-match"      className={({ isActive }) => `app-tab${isActive ? ' active' : ''}`}>Job Match</NavLink>
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
            <div className="app-avatar">{initials}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
