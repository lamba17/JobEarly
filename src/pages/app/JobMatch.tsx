import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { IconSearch } from '../../icons'

interface Job {
  id: number
  role: string
  company: string
  loc: string
  match: number
  desc: string
  tags: string[]
  salary: string
  period: string
  color: string       // fallback bg colour
  domain: string      // for Clearbit logo API
  linkedinSlug: string // linkedin.com/company/[slug]/jobs/
  requirements: string[]
  type: string
}

const INDIA_JOBS: Job[] = [
  {
    id: 1, role: 'Senior Product Manager', company: 'Swiggy', loc: 'Bangalore, IN', match: 96, type: 'Full-time',
    color: '#FC8019', domain: 'swiggy.com', linkedinSlug: 'swiggy',
    desc: 'Lead product strategy for Swiggy\'s core ordering experience. Drive 0-to-1 features serving 90M+ users across India.',
    tags: ['Product Strategy', 'Growth', 'Data-Driven'], salary: '₹40 – ₹60 LPA', period: 'per year',
    requirements: ['5+ years of product management experience', 'Strong data analysis and SQL skills', 'Experience with growth metrics and A/B testing', 'Excellent stakeholder communication', 'Experience in consumer internet or e-commerce'],
  },
  {
    id: 2, role: 'UX Design Lead', company: 'Flipkart', loc: 'Bangalore, IN', match: 91, type: 'Full-time',
    color: '#2874F0', domain: 'flipkart.com', linkedinSlug: 'flipkart',
    desc: 'Define the design language for Flipkart\'s next-gen mobile commerce. Lead a team of 8 designers and own the visual system.',
    tags: ['Design Systems', 'Mobile', 'E-commerce'], salary: '₹35 – ₹55 LPA', period: 'per year',
    requirements: ['7+ years of UX/product design experience', 'Portfolio showcasing end-to-end design work', 'Experience leading design teams', 'Proficiency in Figma and prototyping tools', 'Mobile-first design mindset'],
  },
  {
    id: 3, role: 'Product Designer', company: 'Zomato', loc: 'Gurugram, IN', match: 88, type: 'Full-time',
    color: '#E23744', domain: 'zomato.com', linkedinSlug: 'zomato',
    desc: 'Shape the food discovery and ordering experience used by 20M+ daily active users across India and the Middle East.',
    tags: ['User Research', 'Figma', 'A/B Testing'], salary: '₹25 – ₹40 LPA', period: 'per year',
    requirements: ['3+ years of product design experience', 'Strong portfolio with consumer app case studies', 'Experience with user research and usability testing', 'Proficiency in Figma', 'Data-informed design approach'],
  },
  {
    id: 4, role: 'Senior Consultant', company: 'Infosys', loc: 'Pune, IN', match: 85, type: 'Full-time',
    color: '#007CC3', domain: 'infosys.com', linkedinSlug: 'infosys',
    desc: 'Drive digital transformation engagements for Fortune 500 clients. Lead cross-functional teams and manage client stakeholders.',
    tags: ['Consulting', 'Digital Transformation', 'Agile'], salary: '₹20 – ₹35 LPA', period: 'per year',
    requirements: ['4+ years of management consulting experience', 'Track record of delivering digital transformation projects', 'Strong client-facing communication skills', 'Agile/Scrum certification preferred', 'MBA from a reputed institution preferred'],
  },
  {
    id: 5, role: 'Data Scientist', company: 'Meesho', loc: 'Bangalore, IN', match: 82, type: 'Full-time',
    color: '#570DF8', domain: 'meesho.com', linkedinSlug: 'meesho',
    desc: 'Build ML models to power personalised recommendations and demand forecasting for India\'s fastest-growing social commerce platform.',
    tags: ['Python', 'ML', 'Recommendation Systems'], salary: '₹30 – ₹50 LPA', period: 'per year',
    requirements: ['3+ years in data science or ML engineering', 'Strong Python, SQL, and statistics skills', 'Experience with recommendation systems or forecasting models', 'Familiarity with PyTorch or TensorFlow', 'Experience with large-scale data pipelines'],
  },
  {
    id: 6, role: 'Engineering Manager', company: 'CRED', loc: 'Bangalore, IN', match: 79, type: 'Full-time',
    color: '#1C1C1C', domain: 'cred.club', linkedinSlug: 'cred-club',
    desc: 'Lead a team of 10 engineers building CRED\'s credit management and rewards platform serving India\'s premium credit card users.',
    tags: ['Leadership', 'Backend', 'FinTech'], salary: '₹50 – ₹80 LPA', period: 'per year',
    requirements: ['5+ years of software engineering experience', '2+ years in an engineering leadership role', 'Experience with high-scale backend systems', 'Strong hiring and mentoring track record', 'Fintech or payments domain experience is a plus'],
  },
  {
    id: 7, role: 'Business Analyst', company: 'TCS', loc: 'Mumbai, IN', match: 77, type: 'Full-time',
    color: '#00A0D2', domain: 'tcs.com', linkedinSlug: 'tata-consultancy-services',
    desc: 'Translate business requirements into technical specifications for large-scale enterprise transformation projects across banking and insurance.',
    tags: ['SQL', 'JIRA', 'Stakeholder Management'], salary: '₹12 – ₹22 LPA', period: 'per year',
    requirements: ['2+ years as a Business Analyst', 'Experience with BFSI domain projects', 'Proficiency in SQL and data analysis', 'Strong requirements gathering and documentation skills', 'Familiarity with JIRA and Confluence'],
  },
  {
    id: 8, role: 'Growth Product Manager', company: 'PhonePe', loc: 'Bangalore, IN', match: 84, type: 'Full-time',
    color: '#5F259F', domain: 'phonepe.com', linkedinSlug: 'phonepe',
    desc: 'Own the growth funnel for PhonePe\'s insurance and mutual funds vertical. Drive user acquisition, activation, and retention at scale.',
    tags: ['Growth', 'Analytics', 'FinTech'], salary: '₹35 – ₹55 LPA', period: 'per year',
    requirements: ['4+ years of product management experience', 'Proven track record in growth or PLG roles', 'Strong analytical skills with SQL/Python', 'Experience in fintech or financial products', 'Data-driven approach to product decisions'],
  },
]

const GLOBAL_JOBS: Job[] = [
  {
    id: 1, role: 'Senior Product Architect', company: 'Stellar Systems', loc: 'Remote', match: 98, type: 'Full-time · Remote',
    color: '#1e293b', domain: 'stellar.io', linkedinSlug: 'stellar-development-foundation',
    desc: 'Looking for a visionary leader to drive core architecture of our next-gen cloud infrastructure.',
    tags: ['Distributed Systems', 'Kubernetes', 'Leadership'], salary: '$180k – $220k', period: 'USD / Year',
    requirements: ['8+ years in software architecture', 'Deep expertise in distributed systems', 'Experience leading platform or infra teams', 'Kubernetes and cloud-native proficiency', 'Strong written communication for async-first teams'],
  },
  {
    id: 2, role: 'Lead UX Strategist', company: 'Nexus Finance', loc: 'New York, NY', match: 89, type: 'Full-time',
    color: '#0f172a', domain: 'nexusfinance.com', linkedinSlug: 'nexus-mutual',
    desc: 'Define the editorial design system for a global audience in a top-tier FinTech expansion.',
    tags: ['Design Systems', 'FinTech'], salary: '$165k – $190k', period: 'USD / Year',
    requirements: ['7+ years of UX strategy or design leadership', 'Experience with global-scale design systems', 'Fintech or regulated industry experience', 'Strong collaboration with engineering and product', 'Portfolio with measurable design impact'],
  },
  {
    id: 3, role: 'Principal Product Designer', company: 'Vercel', loc: 'Remote', match: 94, type: 'Full-time · Remote',
    color: '#000000', domain: 'vercel.com', linkedinSlug: 'vercel',
    desc: 'Shape the future of developer experience. Lead design for core platform features used by millions.',
    tags: ['Developer Tools', 'Product Design', 'Figma'], salary: '$170k – $200k', period: 'USD / Year',
    requirements: ['6+ years of product design experience', 'Passion for developer tools and DX', 'Deep Figma expertise', 'Experience shipping complex SaaS features', 'Strong writing and async communication skills'],
  },
  {
    id: 4, role: 'Design System Lead', company: 'Stripe', loc: 'San Francisco', match: 91, type: 'Full-time',
    color: '#635bff', domain: 'stripe.com', linkedinSlug: 'stripe',
    desc: 'Build and scale the design foundation for Stripe\'s product suite across global markets.',
    tags: ['Design Systems', 'React', 'Accessibility'], salary: '$190k – $230k', period: 'USD / Year',
    requirements: ['7+ years of design or front-end experience', 'Deep expertise in design systems and component libraries', 'Experience with React and accessibility standards', 'Cross-functional leadership experience', 'Obsession with quality and craft'],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function detectCountry(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (tz.includes('Kolkata') || tz.includes('Calcutta')) return 'IN'
  return navigator.language === 'en-IN' ? 'IN' : 'GLOBAL'
}

function matchColor(pct: number) {
  if (pct >= 90) return '#10B981'
  if (pct >= 80) return '#F59E0B'
  return '#6B7280'
}

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function getPortalUrls(job: Job, isIndia: boolean) {
  const roleQ = encodeURIComponent(job.role)
  const combined = encodeURIComponent(`${job.role} ${job.company}`)
  const cityRaw = job.loc.split(',')[0].trim()
  const city = encodeURIComponent(cityRaw)
  const roleSlug = toSlug(job.role)
  const citySlug = toSlug(cityRaw)

  return {
    // Opens the company's own LinkedIn jobs page — shows real current openings there
    linkedin: `https://www.linkedin.com/company/${job.linkedinSlug}/jobs/?keywords=${roleQ}`,
    indeed: isIndia
      ? `https://in.indeed.com/jobs?q=${combined}&l=${city}`
      : `https://www.indeed.com/jobs?q=${combined}&l=${encodeURIComponent(job.loc)}`,
    naukri: isIndia
      ? `https://www.naukri.com/${roleSlug}-${toSlug(job.company)}-jobs-in-${citySlug}`
      : null,
  }
}

// ── Company logo via Clearbit, falls back to coloured initials ────────────────
function CompanyLogo({ domain, company, color, size = 36 }: { domain: string; company: string; color: string; size?: number }) {
  const [err, setErr] = useState(false)
  const initial = company[0].toUpperCase()
  if (err) {
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.25, background: color, flexShrink: 0, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.44 }}>
        {initial}
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: '#fff', border: '1px solid #e5eaf5', flexShrink: 0, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={company}
        width={size - 8}
        height={size - 8}
        style={{ objectFit: 'contain' }}
        onError={() => setErr(true)}
      />
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcoClose = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)
const IcoCheck = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoExternal = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

const PORTALS = [
  {
    key: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    bg: '#EFF6FF',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
      </svg>
    ),
    desc: 'World\'s largest professional network',
  },
  {
    key: 'indeed',
    name: 'Indeed',
    color: '#003A9B',
    bg: '#EFF3FF',
    icon: (
      <svg width={20} height={20} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#003A9B"/>
        <text x="7" y="28" fontSize="22" fontWeight="bold" fill="white" fontFamily="Arial">i</text>
      </svg>
    ),
    desc: 'Millions of job listings worldwide',
  },
  {
    key: 'naukri',
    name: 'Naukri',
    color: '#FF7555',
    bg: '#FFF4F0',
    icon: (
      <svg width={20} height={20} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#FF7555"/>
        <text x="5" y="28" fontSize="20" fontWeight="bold" fill="white" fontFamily="Arial">N</text>
      </svg>
    ),
    desc: 'India\'s #1 job portal',
    indiaOnly: true,
  },
]

const FILTERS = ['All Opportunities', 'Remote Only', 'Best Match', 'Latest']
const INDIA_CITIES = ['All Locations', 'Bangalore', 'Mumbai', 'Gurugram', 'Pune', 'Hyderabad']

export default function JobMatch() {
  const { user } = useAuth()
  const [country] = useState(() => detectCountry())
  const [activeFilter, setActiveFilter] = useState('All Opportunities')
  const [cityFilter, setCityFilter] = useState('All Locations')
  const [search, setSearch] = useState('')
  const [detailJob, setDetailJob] = useState<Job | null>(null)
  const [applyJob, setApplyJob] = useState<Job | null>(null)

  const isIndia = country === 'IN'
  const allJobs = isIndia ? INDIA_JOBS : GLOBAL_JOBS

  const relevantJobs = [...allJobs].sort((a, b) => {
    const title = (user?.jobTitle ?? '').toLowerCase()
    const aM = a.role.toLowerCase().includes(title) || a.tags.some(t => t.toLowerCase().includes(title))
    const bM = b.role.toLowerCase().includes(title) || b.tags.some(t => t.toLowerCase().includes(title))
    if (aM && !bM) return -1
    if (!aM && bM) return 1
    return b.match - a.match
  })

  const filtered = relevantJobs.filter(j => {
    if (activeFilter === 'Remote Only' && !j.loc.includes('Remote')) return false
    if (activeFilter === 'Best Match' && j.match < 85) return false
    if (isIndia && cityFilter !== 'All Locations' && !j.loc.includes(cityFilter)) return false
    if (search && !j.role.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const highMatches = allJobs.filter(j => j.match >= 85).length
  const avgMatch = Math.round(allJobs.reduce((s, j) => s + j.match, 0) / allJobs.length)

  const visiblePortals = PORTALS.filter(p => !p.indiaOnly || isIndia)

  const openPortal = (portalKey: string, job: Job) => {
    const urls = getPortalUrls(job, isIndia)
    const url = urls[portalKey as keyof typeof urls]
    if (url) window.open(url, '_blank')
  }

  return (
    <>
      <div className="jm-header">
        <h1>Architected for <em>Success.</em></h1>
        <p>
          {isIndia
            ? `AI-matched roles across India's top tech companies, tailored for ${user?.jobTitle ?? 'your profile'}.`
            : `AI engine has analyzed 42,000 data points across your profile and current market demands.`}
        </p>
        <div className="jm-header-stats">
          <div className="jm-stat-pill"><div className="jm-num">{highMatches}</div><div className="jm-lbl">HIGH MATCHES</div></div>
          <div className="jm-stat-pill"><div className="jm-num">{avgMatch}%</div><div className="jm-lbl">PROFILE FIT</div></div>
          {isIndia && <div className="jm-stat-pill"><div className="jm-num">🇮🇳</div><div className="jm-lbl">INDIA JOBS</div></div>}
        </div>
      </div>

      {/* Filter bar */}
      <div className="jm-filter-bar">
        {FILTERS.map(f => (
          <button key={f} className={`jm-filter-btn${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
        ))}
        {isIndia && (
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="jm-filter-btn"
            style={{ borderColor: cityFilter !== 'All Locations' ? 'var(--border-strong)' : 'transparent', paddingRight: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            {INDIA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div className="jm-search">
          <IconSearch size={14} />
          <input placeholder="Search role or company…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Notices */}
      {isIndia && (
        <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          📍 Showing jobs in <b>India</b> based on your location. Salaries shown in LPA (Lakhs Per Annum).
        </div>
      )}
      <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', marginBottom: 18, fontSize: 12, color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 6 }}>
        ℹ️ AI-curated sample roles based on your profile. Click <b>Quick Apply</b> to apply via LinkedIn, Indeed{isIndia ? ', or Naukri' : ''} — all in one place.
      </div>

      {/* Job grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-mute)' }}>No jobs match your current filters.</div>
      ) : (
        <div className="jm-grid">
          {filtered.map(job => (
            <div key={job.id} className="job-card">
              <div className="match-badge" style={{ background: `${matchColor(job.match)}20`, color: matchColor(job.match), border: `1px solid ${matchColor(job.match)}40` }}>
                {job.match}% Match
              </div>
              <div className="jc-head">
                <CompanyLogo domain={job.domain} company={job.company} color={job.color} size={36} />
                <div>
                  <div className="jc-role">{job.role}</div>
                  <div className="jc-co">{job.company} · {job.loc}</div>
                </div>
              </div>
              <div className="jc-desc">{job.desc}</div>
              <div className="jc-tags">{job.tags.map(t => <span key={t} className="jc-tag">{t}</span>)}</div>
              <div className="jc-footer">
                <div className="jc-salary">{job.salary} <span>{job.period}</span></div>
                <div className="jc-actions">
                  <button className="btn-jc-secondary" onClick={() => setDetailJob(job)}>Details</button>
                  <button className="btn-jc-primary" onClick={() => setApplyJob(job)}>Quick Apply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Panel ─────────────────────────────────────── */}
      {detailJob && (
        <>
          <div className="jm-detail-backdrop" onClick={() => setDetailJob(null)} />
          <div className="jm-detail-panel">
            <div className="jm-detail-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CompanyLogo domain={detailJob.domain} company={detailJob.company} color={detailJob.color} size={40} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>{detailJob.role}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginTop: 2 }}>{detailJob.company} · {detailJob.loc}</div>
                </div>
              </div>
              <button className="jm-detail-close" onClick={() => setDetailJob(null)}><IcoClose /></button>
            </div>
            <div className="jm-detail-body">
              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ background: `${matchColor(detailJob.match)}18`, color: matchColor(detailJob.match), border: `1px solid ${matchColor(detailJob.match)}40`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                  {detailJob.match}% Match
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-mute)', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px' }}>
                  {detailJob.type}
                </span>
              </div>

              {/* Salary */}
              <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 4 }}>COMPENSATION</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{detailJob.salary}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>{detailJob.period}</div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 8 }}>ABOUT THIS ROLE</div>
                <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.65, margin: 0 }}>{detailJob.desc}</p>
              </div>

              {/* Requirements */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 10 }}>REQUIREMENTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {detailJob.requirements.map((req, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--blue-50)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                        <IcoCheck />
                      </span>
                      <span style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.5 }}>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 8 }}>KEY SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detailJob.tags.map(t => <span key={t} className="jc-tag">{t}</span>)}
                </div>
              </div>

              {/* Apply via portals */}
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 10 }}>APPLY VIA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {visiblePortals.map(p => (
                  <button key={p.key} onClick={() => openPortal(p.key, detailJob)} className="jm-portal-btn"
                    style={{ '--portal-color': p.color, '--portal-bg': p.bg } as React.CSSProperties}>
                    <span className="jm-portal-icon">{p.icon}</span>
                    <span className="jm-portal-info">
                      <span className="jm-portal-name">{p.name}</span>
                      <span className="jm-portal-desc">{p.desc}</span>
                    </span>
                    <IcoExternal size={13} />
                  </button>
                ))}
              </div>

              <button onClick={() => setDetailJob(null)}
                style={{ width: '100%', height: 38, borderRadius: 9, background: 'none', color: 'var(--text-mute)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Apply Portal Modal (Quick Apply) ─────────────────── */}
      {applyJob && (
        <div className="jm-apply-backdrop" onClick={() => setApplyJob(null)}>
          <div className="jm-apply-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="jm-apply-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CompanyLogo domain={applyJob.domain} company={applyJob.company} color={applyJob.color} size={36} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>{applyJob.role}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>{applyJob.company} · {applyJob.loc}</div>
                </div>
              </div>
              <button className="jm-detail-close" onClick={() => setApplyJob(null)}><IcoClose /></button>
            </div>

            <div style={{ padding: '6px 18px 8px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 14 }}>
                Choose a job portal to apply. You'll be taken to a live job search for this role — pick what feels right.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visiblePortals.map(p => (
                  <button key={p.key} onClick={() => { openPortal(p.key, applyJob); setApplyJob(null) }} className="jm-portal-btn jm-portal-btn-lg"
                    style={{ '--portal-color': p.color, '--portal-bg': p.bg } as React.CSSProperties}>
                    <span className="jm-portal-icon">{p.icon}</span>
                    <span className="jm-portal-info">
                      <span className="jm-portal-name">{p.name}</span>
                      <span className="jm-portal-desc">{p.desc}</span>
                    </span>
                    <IcoExternal size={13} />
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-mute)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
                Opens a real job search for "{applyJob.role} {applyJob.company}" on your chosen portal.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
