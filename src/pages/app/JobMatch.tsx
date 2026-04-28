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
  logo: string
}

const INDIA_JOBS: Job[] = [
  { id: 1,  role: 'Senior Product Manager',      company: 'Swiggy',         loc: 'Bangalore, IN',  match: 96, desc: 'Lead product strategy for Swiggy\'s core ordering experience. Drive 0-to-1 features serving 90M+ users across India.', tags: ['Product Strategy', 'Growth', 'Data-Driven'], salary: '₹40 – ₹60 LPA', period: 'per year', logo: '#FC8019' },
  { id: 2,  role: 'UX Design Lead',              company: 'Flipkart',        loc: 'Bangalore, IN',  match: 91, desc: 'Define the design language for Flipkart\'s next-gen mobile commerce. You\'ll lead a team of 8 designers and own the visual system.', tags: ['Design Systems', 'Mobile', 'E-commerce'], salary: '₹35 – ₹55 LPA', period: 'per year', logo: '#2874F0' },
  { id: 3,  role: 'Product Designer',            company: 'Zomato',          loc: 'Gurugram, IN',   match: 88, desc: 'Shape the food discovery and ordering experience used by 20M+ daily active users across India and the Middle East.', tags: ['User Research', 'Figma', 'A/B Testing'], salary: '₹25 – ₹40 LPA', period: 'per year', logo: '#E23744' },
  { id: 4,  role: 'Senior Consultant',           company: 'Infosys',         loc: 'Pune, IN',       match: 85, desc: 'Drive digital transformation engagements for Fortune 500 clients. Lead cross-functional teams and manage client stakeholders.', tags: ['Consulting', 'Digital Transformation', 'Agile'], salary: '₹20 – ₹35 LPA', period: 'per year', logo: '#007CC3' },
  { id: 5,  role: 'Data Scientist',              company: 'Meesho',          loc: 'Bangalore, IN',  match: 82, desc: 'Build ML models to power personalised recommendations and demand forecasting for India\'s fastest-growing social commerce platform.', tags: ['Python', 'ML', 'Recommendation Systems'], salary: '₹30 – ₹50 LPA', period: 'per year', logo: '#570DF8' },
  { id: 6,  role: 'Engineering Manager',         company: 'CRED',            loc: 'Bangalore, IN',  match: 79, desc: 'Lead a team of 10 engineers building CRED\'s credit management and rewards platform serving India\'s premium credit card users.', tags: ['Leadership', 'Backend', 'FinTech'], salary: '₹50 – ₹80 LPA', period: 'per year', logo: '#1C1C1C' },
  { id: 7,  role: 'Business Analyst',            company: 'TCS',             loc: 'Mumbai, IN',     match: 77, desc: 'Translate business requirements into technical specifications for large-scale enterprise transformation projects across banking and insurance.', tags: ['SQL', 'JIRA', 'Stakeholder Management'], salary: '₹12 – ₹22 LPA', period: 'per year', logo: '#00A0D2' },
  { id: 8,  role: 'Growth Product Manager',      company: 'PhonePe',         loc: 'Bangalore, IN',  match: 84, desc: 'Own the growth funnel for PhonePe\'s insurance and mutual funds vertical. Drive user acquisition, activation, and retention at scale.', tags: ['Growth', 'Analytics', 'FinTech'], salary: '₹35 – ₹55 LPA', period: 'per year', logo: '#5F259F' },
]

const GLOBAL_JOBS: Job[] = [
  { id: 1,  role: 'Senior Product Architect',    company: 'Stellar Systems', loc: 'Remote',          match: 98, desc: 'Looking for a visionary leader to drive core architecture of our next-gen cloud infrastructure.', tags: ['Distributed Systems', 'Kubernetes', 'Leadership'], salary: '$180k – $220k', period: 'USD / Year', logo: '#1e293b' },
  { id: 2,  role: 'Lead UX Strategist',          company: 'Nexus Finance',   loc: 'New York, NY',    match: 89, desc: 'Define the editorial design system for a global audience in a top-tier FinTech expansion.', tags: ['Design Systems', 'FinTech'], salary: '$165k – $190k', period: 'USD / Year', logo: '#0f172a' },
  { id: 3,  role: 'Principal Product Designer',  company: 'Vercel',          loc: 'Remote',          match: 94, desc: 'Shape the future of developer experience. Lead design for core platform features used by millions.', tags: ['Developer Tools', 'Product Design', 'Figma'], salary: '$170k – $200k', period: 'USD / Year', logo: '#000000' },
  { id: 4,  role: 'Design System Lead',          company: 'Stripe',          loc: 'San Francisco',   match: 91, desc: 'Build and scale the design foundation for Stripe\'s product suite across global markets.', tags: ['Design Systems', 'React', 'Accessibility'], salary: '$190k – $230k', period: 'USD / Year', logo: '#635bff' },
]

function detectCountry(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (tz.includes('Kolkata') || tz.includes('Calcutta')) return 'IN'
  const lang = navigator.language || ''
  if (lang === 'en-IN') return 'IN'
  return 'GLOBAL'
}

const FILTERS = ['All Opportunities', 'Remote Only', 'Best Match', 'Latest']
const INDIA_CITIES = ['All Locations', 'Bangalore', 'Mumbai', 'Gurugram', 'Pune', 'Hyderabad']

export default function JobMatch() {
  const { user } = useAuth()
  const [country] = useState(() => detectCountry())
  const [activeFilter, setActiveFilter] = useState('All Opportunities')
  const [cityFilter, setCityFilter] = useState('All Locations')
  const [search, setSearch] = useState('')

  const allJobs = country === 'IN' ? INDIA_JOBS : GLOBAL_JOBS

  // Sort by relevance to user's job title
  const relevantJobs = [...allJobs].sort((a, b) => {
    const title = (user?.jobTitle ?? '').toLowerCase()
    const aMatch = a.role.toLowerCase().includes(title) || a.tags.some(t => t.toLowerCase().includes(title))
    const bMatch = b.role.toLowerCase().includes(title) || b.tags.some(t => t.toLowerCase().includes(title))
    if (aMatch && !bMatch) return -1
    if (!aMatch && bMatch) return 1
    return b.match - a.match
  })

  const filtered = relevantJobs.filter(j => {
    if (activeFilter === 'Remote Only' && !j.loc.includes('Remote')) return false
    if (activeFilter === 'Best Match' && j.match < 85) return false
    if (country === 'IN' && cityFilter !== 'All Locations' && !j.loc.includes(cityFilter)) return false
    if (search && !j.role.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const highMatches = allJobs.filter(j => j.match >= 85).length
  const avgMatch = Math.round(allJobs.reduce((s, j) => s + j.match, 0) / allJobs.length)

  return (
    <>
      <div className="jm-header">
        <h1>Architected for <em>Success.</em></h1>
        <p>
          {country === 'IN'
            ? `AI-matched roles across India's top tech companies, tailored for ${user?.jobTitle ?? 'your profile'}.`
            : `AI engine has analyzed 42,000 data points across your profile and current market demands.`
          }
        </p>
        <div className="jm-header-stats">
          <div className="jm-stat-pill">
            <div className="jm-num">{highMatches}</div>
            <div className="jm-lbl">HIGH MATCHES</div>
          </div>
          <div className="jm-stat-pill">
            <div className="jm-num">{avgMatch}%</div>
            <div className="jm-lbl">PROFILE FIT</div>
          </div>
          {country === 'IN' && (
            <div className="jm-stat-pill">
              <div className="jm-num">🇮🇳</div>
              <div className="jm-lbl">INDIA JOBS</div>
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="jm-filter-bar">
        {FILTERS.map(f => (
          <button key={f} className={`jm-filter-btn${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
        ))}
        {country === 'IN' && (
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="jm-filter-btn"
            style={{ borderColor: cityFilter !== 'All Locations' ? 'var(--border-strong)' : 'transparent', paddingRight: 8, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {INDIA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div className="jm-search">
          <IconSearch size={14} />
          <input placeholder="Search role or company…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Location notice */}
      {country === 'IN' && (
        <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          📍 Showing jobs in <b>India</b> based on your location. Salaries shown in LPA (Lakhs Per Annum).
        </div>
      )}

      {/* Job grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-mute)' }}>
          No jobs match your current filters. Try adjusting the search or filter options.
        </div>
      ) : (
        <div className="jm-grid">
          {filtered.map(job => (
            <div key={job.id} className="job-card">
              <div className="match-badge">{job.match}% Match</div>
              <div className="jc-head">
                <div className="jc-logo" style={{ background: job.logo }} />
                <div>
                  <div className="jc-role">{job.role}</div>
                  <div className="jc-co">{job.company} · {job.loc}</div>
                </div>
              </div>
              <div className="jc-desc">{job.desc}</div>
              <div className="jc-tags">
                {job.tags.map(t => <span key={t} className="jc-tag">{t}</span>)}
              </div>
              <div className="jc-footer">
                <div className="jc-salary">{job.salary} <span>{job.period}</span></div>
                <div className="jc-actions">
                  <button className="btn-jc-secondary">Details</button>
                  <button className="btn-jc-primary">Quick Apply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

