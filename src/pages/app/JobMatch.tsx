import { useState } from 'react'
import { IconSearch } from '../../icons'

const JOBS = [
  {
    id: 1, role: 'Senior Product Architect', company: 'Stellar Systems', loc: 'Remote', match: 98,
    desc: 'Looking for a visionary leader to drive the core architecture of our next-gen cloud infrastructure. Your experience with distributed systems aligns perfectly with our stack.',
    tags: ['Distributed Systems', 'Kubernetes', 'Lead Experience'],
    salary: '$180k – $220k', period: 'USD / Year', logo: '#1e293b',
    featured: true,
  },
  {
    id: 2, role: 'Lead UX Strategist', company: 'Nexus Finance', loc: 'New York, NY', match: 89,
    desc: 'Define the editorial design system for a global audience. Your portfolio in high-end SaaS environments makes you a top-tier candidate for this expansion.',
    tags: ['Design Systems', 'FinTech'],
    salary: '$165k – $190k', period: 'USD / Year', logo: '#0f172a',
    featured: false,
  },
  {
    id: 3, role: 'Principal Product Designer', company: 'Vercel', loc: 'Remote', match: 94,
    desc: 'Shape the future of developer experience. You\'ll lead design for core platform features used by millions of developers worldwide.',
    tags: ['Developer Tools', 'Product Design', 'Figma'],
    salary: '$170k – $200k', period: 'USD / Year', logo: '#000000',
    featured: false,
  },
  {
    id: 4, role: 'Design System Lead', company: 'Stripe', loc: 'San Francisco, CA', match: 91,
    desc: 'Build and scale the design foundation for Stripe\'s product suite. Partner with engineering to deliver pixel-perfect, accessible components.',
    tags: ['Design Systems', 'React', 'Accessibility'],
    salary: '$190k – $230k', period: 'USD / Year', logo: '#635bff',
    featured: false,
  },
]

const FILTERS = ['All Opportunities', 'Remote Only', 'Salary High-Low', 'Best Match']

export default function JobMatch() {
  const [activeFilter, setActiveFilter] = useState('All Opportunities')
  const [search, setSearch] = useState('')

  const filtered = JOBS.filter(j => {
    const matchFilter = activeFilter === 'Remote Only' ? j.loc === 'Remote'
      : activeFilter === 'Salary High-Low' ? true
      : true
    const matchSearch = j.role.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <>
      <div className="jm-header">
        <h1>Architected for <em>Success.</em></h1>
        <p>Our AI engine has analyzed 42,000 data points across your profile and current market demands. These roles represent your optimal career trajectory.</p>
        <div className="jm-header-stats">
          <div className="jm-stat-pill">
            <div className="jm-num">12</div>
            <div className="jm-lbl">HIGH MATCHES</div>
          </div>
          <div className="jm-stat-pill">
            <div className="jm-num">84%</div>
            <div className="jm-lbl">PROFILE FIT</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="jm-filter-bar">
        {FILTERS.map(f => (
          <button key={f} className={`jm-filter-btn${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
        ))}
        <div className="jm-search">
          <IconSearch size={14} />
          <input placeholder="Search matches…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* AI Pick of the week */}
      <div className="ai-pick-banner" style={{ marginBottom: 20 }}>
        <div className="ai-pick-tag">⚡ AI PICK OF THE WEEK</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>The Opportunity</div>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: 0, lineHeight: 1.5 }}>
              Spearhead the transition to a decentralized micro-grid platform at a high-growth energy startup with Series B funding.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Key Requirements</div>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: 0, lineHeight: 1.5 }}>
              10+ years of energy management · Python & ML experience · Team leadership (bonus)
            </p>
          </div>
        </div>
      </div>

      {/* Job grid */}
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
                <button className="btn-jc-primary">{job.featured ? 'Apply Now' : 'Quick Outreach'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
