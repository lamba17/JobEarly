import { Link } from 'react-router-dom'
import StaticPage from '../components/site/StaticPage'
import { TESTIMONIALS } from '../data/testimonials'
import { IconMail } from '../icons'

type PageProps = { theme: string; toggleTheme: () => void }

export function About({ theme, toggleTheme }: PageProps) {
  return (
    <StaticPage
      theme={theme} toggleTheme={toggleTheme} eyebrow="Company" title="About JobEarly"
      subtitle="We build tools for people who don't want to wait their turn in the job market."
    >
      <h2>Why we started</h2>
      <p>Most job seekers lose out before a human ever reads their resume — filtered by an ATS keyword match, or simply beaten to the recruiter's inbox by someone who applied an hour earlier. JobEarly exists to close that gap: tailor your resume to the role, know your ATS score before you submit, write a cover letter that doesn't read like a template, and reach the recruiter directly.</p>

      <h2>What we believe</h2>
      <ul>
        <li>Speed matters. The earlier a strong application lands, the better its odds — regardless of how good the resume is.</li>
        <li>AI should tailor your real experience, not invent it. Every suggestion is something you can verify and edit before it goes out.</li>
        <li>A job search shouldn't require six different tools glued together with spreadsheets.</li>
      </ul>

      <h2>Get in touch</h2>
      <p>Questions, feedback, or partnership ideas — email <a href="mailto:hello@jobearly.ai">hello@jobearly.ai</a>.</p>
    </StaticPage>
  )
}

export function Careers({ theme, toggleTheme }: PageProps) {
  return (
    <StaticPage theme={theme} toggleTheme={toggleTheme} eyebrow="Company" title="Careers">
      <div className="static-empty">
        <div className="ico">🌱</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>No open roles right now</div>
        <div style={{ fontSize: 14, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
          We're a small team today. If that changes, roles will be posted here first — in the meantime, feel free to introduce yourself.
        </div>
        <a href="mailto:hello@jobearly.ai" className="btn btn-primary btn-sm" style={{ marginTop: 20, display: 'inline-flex' }}>
          <IconMail size={14} /> Say hello
        </a>
      </div>
    </StaticPage>
  )
}

export function Customers({ theme, toggleTheme }: PageProps) {
  return (
    <StaticPage
      theme={theme} toggleTheme={toggleTheme} eyebrow="Company" title="Customers"
      subtitle="A few of the candidates who've used JobEarly to land their next role."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="static-card" style={{ margin: 0 }}>
            <p style={{ fontStyle: 'italic', marginBottom: 10 }}>"{t.q}"</p>
            <h3 style={{ marginBottom: 0 }}>{t.n}</h3>
            <p style={{ fontSize: 12.5 }}>{t.r}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  )
}

export function Press({ theme, toggleTheme }: PageProps) {
  return (
    <StaticPage theme={theme} toggleTheme={toggleTheme} eyebrow="Company" title="Press">
      <div className="static-empty">
        <div className="ico">📰</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>Nothing published yet</div>
        <div style={{ fontSize: 14, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
          Working on a story about JobEarly, or want a comment? We'd love to talk.
        </div>
        <a href="mailto:hello@jobearly.ai" className="btn btn-primary btn-sm" style={{ marginTop: 20, display: 'inline-flex' }}>
          <IconMail size={14} /> Contact press
        </a>
      </div>
    </StaticPage>
  )
}

export function Contact({ theme, toggleTheme }: PageProps) {
  return (
    <StaticPage
      theme={theme} toggleTheme={toggleTheme} eyebrow="Company" title="Contact Us"
      subtitle="Product questions, billing, bugs, or partnership ideas — we read everything."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 8 }}>
        <div className="static-card" style={{ margin: 0 }}>
          <h3>General & Support</h3>
          <p><a href="mailto:hello@jobearly.ai">hello@jobearly.ai</a></p>
        </div>
        <div className="static-card" style={{ margin: 0 }}>
          <h3>In the product</h3>
          <p>Signed in? <Link to="/app/help">Submit a support ticket</Link> from the Help Center for faster tracking.</p>
        </div>
      </div>
    </StaticPage>
  )
}
