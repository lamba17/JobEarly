import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconRocket, IconSun, IconMoon, IconArrowRight } from '../../icons'

export default function Navbar({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  useState(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn, { passive: true })
  })
  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="container nav-row">
        <Link to="/" className="brand">
          <span className="brand-mark"><IconRocket size={16} stroke={2.4} /></span>
          <span>JobEarly</span>
        </Link>
        <div className="nav-links">
          {([['Features','/#features'],['How it works','/#how'],['Pricing','/#pricing'],['FAQ','/#faq']] as [string,string][]).map(([l,h]) => (
            <a key={l} className="nav-link" href={h}>{l}</a>
          ))}
        </div>
        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
          <Link to="/signin" className="btn btn-ghost btn-sm nav-signin">Sign in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">
            Get Early Access <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  )
}
