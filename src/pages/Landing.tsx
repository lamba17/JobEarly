import { useState, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  IconRocket, IconSparkle, IconDoc, IconSend, IconMail, IconChart,
  IconSun, IconMoon, IconArrowRight, IconCheck, IconPlus, IconShield,
  IconBriefcase, IconReply, IconTwitter, IconLinkedIn, IconGithub,
} from '../icons'

/* ── Navbar ─────────────────────────────────── */
function Navbar({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
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
          {([['Features','#features'],['How it works','#how'],['Pricing','#pricing'],['FAQ','#faq']] as [string,string][]).map(([l,h]) => (
            <a key={l} className="nav-link" href={h}>{l}</a>
          ))}
        </div>
        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
          <Link to="/signin" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/signup" className="btn btn-soft btn-sm">Sign up</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">
            Get Early Access <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ── Mock Dashboard ─────────────────────────── */
function MockDashboard() {
  const navItems = [
    { label: 'Dashboard',   active: true,  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg> },
    { label: 'Resumes',     active: false, icon: <IconDoc size={14} /> },
    { label: 'Job Matches', active: false, icon: <IconBriefcase size={14} /> },
    { label: 'Analytics',   active: false, icon: <IconChart size={14} /> },
  ]
  const cards = [
    { icon: <IconDoc size={16} />,     lbl: 'RESUMES CREATED', num: '24',  delta: '+12% from last month' },
    { icon: <IconSparkle size={16} />, lbl: 'JOBS MATCHED',    num: '142', delta: '8 High-Probability Leads' },
    { icon: <IconSend size={16} />,    lbl: 'OUTREACH SENT',   num: '38',  delta: '15 Responses received' },
  ]
  const recentDocs = [
    ['Product Designer — Google.pdf',  '2 hours ago • 98% ATS Match'],
    ['UX Architect — Airbnb.pdf',      'Yesterday • 94% ATS Match'],
    ['Senior Designer — Stripe.pdf',   '3 days ago • 89% ATS Match'],
  ]
  return (
    <div className="mock">
      <aside className="mock-side">
        <div className="mock-brand">
          <div className="mark"><IconRocket size={12} stroke={2.4} /></div>
          <div>
            <div className="name">JobEarly</div>
            <div className="tag">EARLY ACCESS</div>
          </div>
        </div>
        {navItems.map(({ label, active, icon }) => (
          <div key={label} className={`mock-nav-item${active ? ' active' : ''}`}>
            <span className="ico">{icon}</span>{label}
          </div>
        ))}
        <div className="upgrade">
          <div className="small">PRO PLAN</div>
          <div className="ttl">Unlock unlimited AI resume tailoring.</div>
          <span className="btn-mini">Upgrade to Pro</span>
        </div>
      </aside>
      <div className="mock-main">
        <h2 className="mock-greeting">Good morning, Alex.</h2>
        <p className="mock-sub">
          Your AI career architect has identified <b>12 new matches</b> aligned with your Senior Product Designer trajectory.
        </p>
        <div className="mock-cards">
          {cards.map(({ icon, lbl, num, delta }) => (
            <div key={lbl} className="mock-card">
              <div className="ico-tile">{icon}</div>
              <div className="lbl">{lbl}</div>
              <div className="num">{num}</div>
              <div className="delta">{delta}</div>
            </div>
          ))}
        </div>
        <div className="mock-rows">
          <div>
            <div className="mock-section-title">
              <h4>Recent Activity</h4><a href="#">View All</a>
            </div>
            {recentDocs.map(([t, m]) => (
              <div key={t} className="mock-row">
                <div className="doc"><IconDoc size={14} /></div>
                <div>
                  <div className="ttl">{t}</div>
                  <div className="meta">{m}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="mock-section-title">
              <h4>Recommended</h4><a href="#">Explore More</a>
            </div>
            <div className="mock-rec">
              <div className="head">
                <div className="logo" style={{ background: '#0F172A' }} />
                <div className="role">Staff Product Designer</div>
                <div className="badge">★ AI PICK</div>
              </div>
              <div className="desc">
                Figma · Remote — Your design systems experience matches 94% of this role's requirements.
              </div>
              <span className="apply">Apply with AI Tailoring</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Hero ───────────────────────────────────── */
function Hero() {
  const tile: CSSProperties = {
    width: 28, height: 28, borderRadius: 8,
    background: 'var(--blue-50)', color: 'var(--accent)',
    display: 'grid', placeItems: 'center',
  }
  return (
    <section className="hero">
      <div className="hero-grid" />
      <div className="container">
        <div className="hero-inner">
          <div className="eyebrow">
            <span className="pill">NEW</span>
            AI-powered ATS scoring is here
            <span className="arrow">→</span>
          </div>
          <h1>
            Get hired{' '}
            <span className="serif-italic accent">before</span>
            <br />everyone else.
          </h1>
          <p className="lede">
            JobEarly tailors resumes, beats ATS filters, writes cover letters, and sends recruiter
            outreach — so you apply faster, smarter, and earlier than the competition.
          </p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start free — no card needed <IconArrowRight size={16} />
            </Link>
            <a href="#how" className="btn btn-ghost btn-lg">Watch 90-sec demo</a>
          </div>
          <div className="hero-trust">
            <div className="hero-avatars">
              {(['', 'b', 'c', 'd', 'e'] as string[]).map(c => (
                <div key={c} className={`placeholder-avatar${c ? ' ' + c : ''}`} />
              ))}
            </div>
            <span>
              <span className="stars">★★★★★</span>
              &nbsp; Trusted by 10,000+ candidates from Google, Stripe, Airbnb
            </span>
          </div>
        </div>
        <div className="hero-mock-wrap">
          <div className="hero-floating f1">
            <div style={tile}><IconSparkle size={14} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12.5 }}>Resume tailored</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>For Stripe · 98% match</div>
            </div>
          </div>
          <div className="hero-floating f2">
            <div style={{ width: 28, height: 28, borderRadius: 999, background: '#DCFCE7', color: '#16A34A', display: 'grid', placeItems: 'center' }}>
              <IconCheck size={12} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12.5 }}>Recruiter replied</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>Sara at Linear · 4m ago</div>
            </div>
          </div>
          <div className="hero-mock">
            <MockDashboard />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Stats ──────────────────────────────────── */
function Stats() {
  return (
    <section className="stats">
      <div className="container">
        <div className="stats-row">
          {([
            { num: '10,000+', label: 'Resumes tailored',         accent: false },
            { num: '94%',     label: 'Average ATS pass rate',    accent: true  },
            { num: '3×',      label: 'More interview invites',   accent: false },
            { num: '< 90s',   label: 'Avg. tailor + apply time', accent: false },
          ] as { num: string; label: string; accent: boolean }[]).map(({ num, label, accent }) => (
            <div key={label} className="stat">
              <div className="num">{accent ? <span className="accent">{num}</span> : num}</div>
              <div className="lbl">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Bento ──────────────────────────────────── */
function Bento() {
  const resumeLines = ['', 'short', 'accent', '', 'short', '', 'accent', 'short']
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow"><IconSparkle size={12} /> Features</div>
          <h2>Every step from resume to <span className="ital">offer</span>.</h2>
          <p className="sub">Built for the modern job hunt. JobEarly combines ATS-grade tooling, AI personalization, and recruiter-ready outreach — all in one workspace.</p>
        </div>
        <div className="bento">
          <div className="bento-card span-3 row-2">
            <div className="ico-tile"><IconDoc size={20} /></div>
            <h3>ATS Resume Builder</h3>
            <p>Templates engineered against real applicant tracking systems. Drag, drop, regenerate — every line is tailored to the job you want.</p>
            <div className="bento-vis resume-vis">
              <div className="resume-card">
                <div className="resume-head">
                  <div className="nm">Alex Thorne</div>
                  <div className="role">Senior Product Designer</div>
                </div>
                <div className="resume-body">
                  <div className="resume-tags">
                    <span className="resume-tag">Design Systems</span>
                    <span className="resume-tag">Figma</span>
                    <span className="resume-tag">React</span>
                  </div>
                  {resumeLines.map((cls, i) => (
                    <div key={i} className={`resume-line${cls ? ' ' + cls : ''}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bento-card span-3 row-2">
            <div className="ico-tile"><IconShield size={20} /></div>
            <h3>ATS Readiness Score</h3>
            <p>Live keyword match, structural integrity, and a 0–100 score — so you know exactly what to fix before you submit.</p>
            <div className="bento-vis ats-vis">
              <div className="ats-ring"><div className="num">94%</div></div>
            </div>
          </div>
          <div className="bento-card span-2">
            <div className="ico-tile"><IconBriefcase size={20} /></div>
            <h3>Smart Job Matching</h3>
            <p>42,000 data points scanned per profile. Surfaces the roles where you'll actually win.</p>
            <div className="bento-vis match-vis">
              <div className="match-card">
                <div className="logo" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }} />
                <div className="info">
                  <div className="role">Sr. Product Designer</div>
                  <div className="co">Stellar Systems</div>
                </div>
                <div className="pct">98%</div>
              </div>
            </div>
          </div>
          <div className="bento-card span-2">
            <div className="ico-tile"><IconMail size={20} /></div>
            <h3>AI Cover Letters</h3>
            <p>Personal, specific, and never robotic. Drafts in 8 seconds.</p>
            <div className="bento-vis cover-vis">
              <div className="cover-doc">
                <div className="greet">Dear Maya,</div>
                Linear's recent shift toward graph-based planning aligns directly with my work
                shipping the planning layer at Stripe<span className="cover-cursor" />
              </div>
            </div>
          </div>
          <div className="bento-card span-2">
            <div className="ico-tile"><IconSend size={20} /></div>
            <h3>Smart Outreach</h3>
            <p>Recruiter-ready emails with reply tracking + follow-up sequencing.</p>
            <div className="bento-vis outreach-vis">
              <div className="email-card replied">
                <div className="av">SK</div>
                <div className="info">
                  <div className="who">Sara Kim · Linear</div>
                  <div className="preview">Re: Loved your portfolio — let's talk</div>
                </div>
                <div style={{ color: '#22C55E', flexShrink: 0 }}><IconReply size={14} /></div>
              </div>
              <div className="email-card">
                <div className="av">MR</div>
                <div className="info">
                  <div className="who">Marco Reyes · Vercel</div>
                  <div className="preview">Quick question about your DS work</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── How It Works ───────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Upload your resume',    body: 'Or start from a template. We parse roles, achievements, and keywords automatically.' },
    { n: '02', title: 'Pick a target role',    body: 'Paste a job link or describe your dream role. JobEarly extracts what matters.' },
    { n: '03', title: 'AI tailors everything', body: 'Resume, summary, and bullet impact rewritten to match the role — in seconds.' },
    { n: '04', title: 'ATS score + fix',       body: 'See exactly which keywords are missing and accept one-click fixes.' },
    { n: '05', title: 'Generate cover letter', body: 'Personalized to the company, the team, and your story — no more templates.' },
    { n: '06', title: 'Outreach + apply',      body: 'Send recruiter emails, track replies, and apply with one click.' },
  ]
  return (
    <section className="section" id="how" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow"><IconSparkle size={12} /> How it works</div>
          <h2>From résumé to reply in <span className="ital">six steps</span>.</h2>
          <p className="sub">A guided workflow, not a blank page. Each step takes seconds and stacks toward an offer.</p>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div key={i} className="step">
              <div className="num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {i < steps.length - 1 && (i + 1) % 3 !== 0 && <div className="arrow" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Testimonials ───────────────────────────── */
interface Testimonial { q: string; n: string; r: string; av: string }
const TESTIMONIALS: Testimonial[] = [
  { q: "I went from 0 callbacks in 6 weeks to 4 onsite interviews in 9 days. The ATS score told me exactly what was wrong.", n: "Priya Shah",    r: "Senior PM → Stripe",         av: ''  },
  { q: "The cover letters don't read like AI. My recruiter literally asked who wrote them. I told her — she signed up.",       n: "Marcus Chen",   r: "Eng Manager → Linear",      av: 'b' },
  { q: "Outreach mode is the unlock. I sent 18 emails, got 11 replies, and landed two final rounds in a week.",               n: "Sara Okafor",   r: "Product Designer → Figma",  av: 'c' },
  { q: "I had been job hunting for 4 months. JobEarly got me to offer in 16 days. The keyword matching is unreal.",           n: "Daniel Rivera", r: "Data Scientist → Anthropic", av: 'd' },
  { q: "Finally — a tool that doesn't make me sound like a LinkedIn bot. The AI gets my voice and improves it.",              n: "Amélie Laurent", r: "Brand Designer → Notion",   av: 'e' },
  { q: "I used to spend an entire weekend tailoring one resume. JobEarly does it in 30 seconds, better than I could.",        n: "Tomás Aguilar", r: "Senior Dev → Vercel",        av: ''  },
  { q: "The job match scoring saves me hours. I only apply where I have a real shot now — and I get more interviews.",        n: "Naomi Park",    r: "UX Researcher → Airbnb",     av: 'b' },
  { q: "Pro is criminally underpriced. I'd pay 5× for what this thing did to my hit rate.",                                   n: "Jordan Bailey", r: "Growth Marketer → Ramp",     av: 'c' },
]
function TmCard({ t }: { t: Testimonial }) {
  return (
    <div className="tm-card">
      <div className="stars">★★★★★</div>
      <p className="quote">"{t.q}"</p>
      <div className="who">
        <div className={`av placeholder-avatar${t.av ? ' ' + t.av : ''}`} />
        <div><div className="nm">{t.n}</div><div className="role">{t.r}</div></div>
      </div>
    </div>
  )
}
function Testimonials() {
  const row1 = TESTIMONIALS.slice(0, 4)
  const row2 = TESTIMONIALS.slice(4)
  return (
    <section className="tm-section">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow"><IconSparkle size={12} /> Loved by candidates</div>
          <h2>Built for the people getting <span className="ital">hired</span>.</h2>
          <p className="sub">10,000+ candidates have used JobEarly to land roles at the companies they actually want.</p>
        </div>
      </div>
      <div className="tm-track-wrap">
        <div className="tm-track">{[...row1, ...row1].map((t, i) => <TmCard key={i} t={t} />)}</div>
        <div className="tm-track row-2">{[...row2, ...row2].map((t, i) => <TmCard key={i} t={t} />)}</div>
      </div>
    </section>
  )
}

/* ── Pricing ────────────────────────────────── */
function Pricing() {
  const [annual, setAnnual] = useState(true)
  const toggleRef = useRef<HTMLDivElement>(null)
  const [pillStyle, setPillStyle] = useState<CSSProperties>({})

  useLayoutEffect(() => {
    if (!toggleRef.current) return
    const btn = toggleRef.current.querySelector<HTMLButtonElement>(`button[data-key="${annual ? 'a' : 'm'}"]`)
    if (btn) setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [annual])

  const proPrice  = annual ? '₹299' : '₹599'
  const proStrike = annual ? '₹599' : null
  const freeFeatures = ['3 AI-tailored resumes / month', 'Basic ATS scoring', '5 cover letter drafts', 'Unlimited job matching', 'Standard email support']
  const proFeatures  = ['Unlimited AI-tailored resumes', 'Advanced ATS readiness audits', 'Unlimited cover letters', 'Smart Outreach with reply tracking', 'Performance analytics + insights', 'Priority human + AI support']

  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow"><IconSparkle size={12} /> Pricing</div>
          <h2>Simple plans. <span className="ital">Real</span> outcomes.</h2>
          <p className="sub">Start free. Upgrade when you're ready to send unlimited outreach and unlock advanced AI tailoring.</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="pricing-toggle" ref={toggleRef}>
            <div className="pill-bg" style={pillStyle} />
            <button data-key="m" className={!annual ? 'active' : ''} onClick={() => setAnnual(false)}>Monthly</button>
            <button data-key="a" className={annual ? 'active' : ''} onClick={() => setAnnual(true)}>Annual <span className="save-tag">SAVE 50%</span></button>
          </div>
        </div>
        <div className="pricing-grid">
          <div className="price-card free">
            <div className="tier">Free</div>
            <div className="price"><div className="amt">₹0</div><div className="per">/ forever</div></div>
            <p className="desc">For candidates testing the waters. Generous limits, no card required.</p>
            <ul>{freeFeatures.map(f => <li key={f}><span className="check"><IconCheck size={11} /></span>{f}</li>)}</ul>
            <Link to="/signup" className="price-cta">Get started free</Link>
          </div>
          <div className="price-card featured">
            <div className="badge">★ MOST POPULAR</div>
            <div className="tier">Pro</div>
            <div className="price">
              {proStrike && <span className="strike">{proStrike}</span>}
              <div className="amt">{proPrice}</div>
              <div className="per">/ month{annual && ', billed yearly'}</div>
            </div>
            <p className="desc">For serious job seekers. Unlimited everything, plus recruiter outreach + analytics.</p>
            <ul>{proFeatures.map(f => <li key={f}><span className="check"><IconCheck size={11} /></span>{f}</li>)}</ul>
            <Link to="/signup" className="price-cta">Start 14-day Pro trial</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── FAQ ────────────────────────────────────── */
const FAQS = [
  { q: 'How does JobEarly beat ATS filters?',   a: 'We parse the actual job description, extract scoring keywords and structural requirements, and rewrite your resume to match — without keyword stuffing. Our scoring engine is benchmarked against the same parsers used by Workday, Greenhouse, Lever, and Taleo.' },
  { q: 'Will my resume sound like AI?',         a: 'No. Our models are tuned on hiring-manager-approved writing — concise, specific, quantitative. We preserve your voice and only edit for impact, clarity, and keyword alignment. You can review every change before accepting.' },
  { q: 'Do you support international roles?',   a: 'Yes. JobEarly works for English-language roles globally and includes filters for sponsorship-friendly companies, regional ATS systems, and salary band detection in 20+ markets including India, US, UK, and EU.' },
  { q: 'Is my data private?',                   a: 'Your resume, job search history, and outreach inbox are encrypted at rest and never used to train shared models. You can export or delete everything in one click. SOC 2 Type II audit completed Q1 2026.' },
  { q: 'Can I cancel anytime?',                 a: "Yes. Pro is month-to-month or annual — cancel from your account any time, and you'll keep access until the end of the period. No questions asked." },
  { q: "What's included in the free plan?",     a: '3 AI-tailored resumes per month, basic ATS scoring, 5 cover letter drafts, and unlimited job matching. Plenty to land your next role — most free users land an interview within 3 weeks.' },
]
function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section" id="faq" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow"><IconSparkle size={12} /> FAQ</div>
          <h2>Questions, <span className="ital">answered</span>.</h2>
          <p className="sub">Still curious? <a href="mailto:hello@jobearly.ai" style={{ color: 'var(--accent)', fontWeight: 600 }}>Talk to a human →</a></p>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className={`faq-item${open === i ? ' open' : ''}`}>
              <button className="faq-trigger" onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}<span className="plus"><IconPlus size={14} /></span>
              </button>
              <div className="faq-content"><div><p>{f.a}</p></div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── CTA Banner ─────────────────────────────── */
function CtaBanner() {
  return (
    <div className="container" style={{ paddingTop: 96 }}>
      <div className="cta-banner">
        <h2>Apply earlier. Get hired faster.</h2>
        <p>Join 10,000+ candidates already using JobEarly to beat ATS filters and land interviews at the companies they actually want.</p>
        <div className="ctas">
          <Link to="/signup" className="btn btn-primary btn-lg">Start free <IconArrowRight size={16} /></Link>
          <a href="#" className="btn btn-ghost btn-lg">Book a 15-min demo</a>
        </div>
      </div>
    </div>
  )
}

/* ── Footer ─────────────────────────────────── */
function Footer() {
  const socials = [
    { key: 'twitter',  icon: <IconTwitter size={14} />  },
    { key: 'linkedin', icon: <IconLinkedIn size={14} /> },
    { key: 'github',   icon: <IconGithub size={14} />   },
  ]
  const cols = [
    { h: 'Product',   links: ['Resume Builder', 'ATS Score', 'Job Matching', 'Cover Letters', 'Smart Outreach'] },
    { h: 'Resources', links: ['Blog', 'Resume guides', 'ATS playbook', 'Salary insights', 'Changelog'] },
    { h: 'Company',   links: ['About', 'Careers', 'Customers', 'Press', 'Contact'] },
    { h: 'Legal',     links: ['Privacy', 'Terms', 'Security', 'DPA', 'Cookies'] },
  ]
  const iconBox: CSSProperties = {
    width: 32, height: 32, borderRadius: 8,
    border: '1px solid var(--border)', display: 'grid',
    placeItems: 'center', color: 'var(--text-soft)',
  }
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand">
              <span className="brand-mark"><IconRocket size={16} stroke={2.4} /></span>
              <span>JobEarly</span>
            </Link>
            <p className="desc">AI-powered job application platform. Get hired before everyone else.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {socials.map(({ key, icon }) => <a key={key} href="#" style={iconBox}>{icon}</a>)}
            </div>
          </div>
          {cols.map(({ h, links }) => (
            <div key={h} className="footer-col">
              <h5>{h}</h5>
              <ul>{links.map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <div>© 2026 JobEarly, Inc. — Made for people who don't wait.</div>
          <div className="legal"><a href="#">Status</a><a href="#">Sitemap</a></div>
        </div>
      </div>
    </footer>
  )
}

/* ── Landing Page ───────────────────────────── */
export default function Landing({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <Hero />
      <Stats />
      <Bento />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CtaBanner />
      <Footer />
    </>
  )
}
