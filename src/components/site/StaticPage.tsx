import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { IconSparkle } from '../../icons'

export default function StaticPage({
  theme, toggleTheme, eyebrow, title, subtitle, updated, children,
}: {
  theme: string
  toggleTheme: () => void
  eyebrow: string
  title: ReactNode
  subtitle?: string
  updated?: string
  children: ReactNode
}) {
  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <section className="section" style={{ paddingTop: 140 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="section-eyebrow"><IconSparkle size={12} /> {eyebrow}</div>
          <h1 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '16px 0 10px', lineHeight: 1.1 }}>{title}</h1>
          {updated && <p style={{ color: 'var(--text-mute)', fontSize: 13, margin: '0 0 24px' }}>Last updated {updated}</p>}
          {subtitle && <p className="sub" style={{ margin: '0 0 36px' }}>{subtitle}</p>}
          <div className="static-prose">{children}</div>
        </div>
      </section>
      <Footer />
    </>
  )
}
