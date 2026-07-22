import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconCheck, IconSparkle } from '../../icons'
import { useAuth } from '../../context/AuthContext'
import { loadJobs, STATUS_META, PORTAL_META, ALL_STATUSES, ALL_PORTALS, type JobApplication, type Status } from '../../lib/jobTracker'

const SUBTABS = ['Analytics', 'Resume Performance', 'Market Insights', 'Interview Readiness']

// ── Resume Performance data ───────────────────────────────────────────────────
const KEYWORDS_FOUND   = ['Product Strategy', 'User Research', 'Figma Master', 'Agile Methodology']
const KEYWORDS_MISSING = ['Kubernetes', 'A/B Testing', 'System Design', 'SQL Proficiency']
const INTEGRITY = [
  { label: 'Contact Headers',         ok: true  },
  { label: 'Section Hierarchy',       ok: true  },
  { label: 'File Metadata',           ok: true  },
  { label: 'Optimal Length (1 Page)', ok: false },
  { label: 'Standard Font Usage',     ok: true  },
]
const BARS = [
  { label: 'VER. 1.0', h: 35 },
  { label: 'VER. 1.2', h: 55 },
  { label: 'VER. 2.0', h: 72 },
  { label: 'CURRENT',  h: 94, current: true },
]

// ── Market Insights data ──────────────────────────────────────────────────────
const SALARY_RANGES = [
  { role: 'Product Manager',       low: 18, high: 45, median: 30, color: '#2563EB' },
  { role: 'Senior PM',             low: 35, high: 80, median: 55, color: '#7C3AED' },
  { role: 'Product Designer',      low: 15, high: 45, median: 28, color: '#0891B2' },
  { role: 'Engineering Manager',   low: 40, high: 95, median: 65, color: '#059669' },
  { role: 'Data Scientist',        low: 20, high: 55, median: 35, color: '#D97706' },
]
const TRENDING_SKILLS = [
  { skill: 'Generative AI / LLMs', growth: '+340%', hot: true  },
  { skill: 'Product-Led Growth',   growth: '+88%',  hot: true  },
  { skill: 'Data Analysis (SQL)',  growth: '+61%',  hot: false },
  { skill: 'System Design',        growth: '+54%',  hot: false },
  { skill: 'Figma / Prototyping',  growth: '+42%',  hot: false },
  { skill: 'Agile / Scrum',        growth: '+29%',  hot: false },
]
const TOP_HIRING = [
  { company: 'Swiggy',    openings: 38, color: '#FC8019' },
  { company: 'Flipkart',  openings: 31, color: '#2874F0' },
  { company: 'Razorpay',  openings: 24, color: '#2EB5C9' },
  { company: 'PhonePe',   openings: 22, color: '#5F259F' },
  { company: 'Google',    openings: 19, color: '#4285F4' },
]

// ── Interview Readiness data ──────────────────────────────────────────────────
const READINESS_AREAS = [
  { area: 'Behavioural Questions', score: 82, color: '#2563EB' },
  { area: 'Case Studies',          score: 68, color: '#7C3AED' },
  { area: 'Product Sense',         score: 91, color: '#059669' },
  { area: 'Analytical Thinking',   score: 74, color: '#D97706' },
  { area: 'Technical Depth',       score: 55, color: '#EF4444' },
]
const PREP_CHECKLIST = [
  { item: 'Research target companies (3+)',     done: true  },
  { item: 'Prepare STAR method stories (5+)',   done: true  },
  { item: 'Practice case study framework',      done: false },
  { item: 'Prepare questions for interviewers', done: false },
  { item: 'Mock interview completed',           done: false },
  { item: 'Review resume talking points',       done: true  },
]
const SAMPLE_QUESTIONS = [
  { q: 'Walk me through a product you launched from 0 to 1.',          tag: 'Product Sense' },
  { q: 'How would you prioritize a backlog with conflicting requests?', tag: 'Prioritisation' },
  { q: 'Tell me about a time you led without authority.',               tag: 'Behavioural' },
  { q: 'How would you improve Swiggy\'s retention by 20%?',            tag: 'Case Study' },
]

// ── Shared helpers ────────────────────────────────────────────────────────────
function IconClock() {
  return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function IconTrend() {
  return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
}
function IconBriefcase() {
  return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
}
function IconStar() {
  return <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}

// ── Tab: Analytics ────────────────────────────────────────────────────────────
const PIPELINE_ORDER: Status[] = ['wishlist', 'applied', 'phone_screen', 'interview', 'final_round', 'offer', 'rejected', 'withdrawn']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function startOfWeek(d: Date): Date {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7)) // back to Monday
  return dt
}

function buildWeeklyBuckets(jobs: JobApplication[], weeks: number) {
  const thisWeekStart = startOfWeek(new Date())
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(thisWeekStart)
    start.setDate(start.getDate() - (weeks - 1 - i) * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const count = jobs.filter(j => {
      if (!j.dateApplied) return false
      const d = new Date(j.dateApplied)
      return d >= start && d < end
    }).length
    return { label: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count }
  })
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function TabAnalytics() {
  const { user } = useAuth()
  const jobs = loadJobs(user?.email)
  const total = jobs.length

  if (total === 0) {
    return (
      <div className="perf-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>📊</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>No application data yet</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-mute)', marginBottom: 22, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
          Track your applications in Job Tracker and this tab will fill up with real trends — status breakdowns, portal performance, and weekly activity.
        </div>
        <Link to="/app/job-match" className="btn btn-primary btn-sm" style={{ display: 'inline-flex' }}>
          Go to Job Tracker
        </Link>
      </div>
    )
  }

  const counts = ALL_STATUSES.reduce((acc, s) => ({ ...acc, [s]: jobs.filter(j => j.status === s).length }), {} as Record<Status, number>)
  const activeCount = jobs.filter(j => ['applied', 'phone_screen', 'interview', 'final_round'].includes(j.status)).length
  const interviewCount = (counts.phone_screen ?? 0) + (counts.interview ?? 0) + (counts.final_round ?? 0)
  const offerCount = counts.offer ?? 0
  const rejectedCount = counts.rejected ?? 0
  const responseRate = Math.round(((total - (counts.applied ?? 0) - (counts.wishlist ?? 0)) / total) * 100)
  const offerRate = Math.round((offerCount / total) * 100)

  const weeklyBuckets = buildWeeklyBuckets(jobs, 8)
  const maxWeekly = Math.max(1, ...weeklyBuckets.map(b => b.count))

  const portalCounts = ALL_PORTALS
    .map(p => ({ portal: p, count: jobs.filter(j => j.portal === p).length }))
    .filter(p => p.count > 0)
    .sort((a, b) => b.count - a.count)

  const companyMap = new Map<string, { company: string; count: number; latest: JobApplication }>()
  jobs.forEach(j => {
    const existing = companyMap.get(j.company)
    if (!existing) companyMap.set(j.company, { company: j.company, count: 1, latest: j })
    else {
      existing.count++
      if (j.dateApplied >= existing.latest.dateApplied) existing.latest = j
    }
  })
  const topCompanies = [...companyMap.values()].sort((a, b) => b.count - a.count).slice(0, 5)

  const recent = [...jobs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4)

  // Dynamic insight, prioritising actionable follow-ups over general trends
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const in7 = new Date(today); in7.setDate(in7.getDate() + 7)
  const dueFollowUps = jobs.filter(j => j.followUpDate && new Date(j.followUpDate) >= today && new Date(j.followUpDate) <= in7)

  let insightTitle = 'Keep the Momentum'
  let insightText = `You've tracked ${total} application${total === 1 ? '' : 's'} with a ${responseRate}% response rate. Applying consistently every week is the strongest predictor of landing interviews.`
  if (dueFollowUps.length > 0) {
    insightTitle = 'Follow-ups Due This Week'
    insightText = `${dueFollowUps.length} follow-up${dueFollowUps.length > 1 ? 's are' : ' is'} due within 7 days — including ${dueFollowUps.slice(0, 2).map(j => j.company).join(', ')}. Following up promptly noticeably improves response odds.`
  } else if (total >= 4) {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]
    jobs.forEach(j => { if (j.dateApplied) dayCounts[new Date(j.dateApplied).getDay()]++ })
    const maxDay = dayCounts.indexOf(Math.max(...dayCounts))
    insightTitle = 'Your Busiest Apply Day'
    insightText = `${DAY_NAMES[maxDay]} is when you apply most (${dayCounts[maxDay]} of ${total} applications). Spreading applications across Tue–Thu tends to catch recruiters when they're most active.`
  }

  return (
    <div className="perf-layout">
      <div className="perf-main">
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 2 }}>
          {[
            { label: 'Total Applications', value: String(total),           sub: `${activeCount} active`,                color: 'var(--accent)' },
            { label: 'Active Pipeline',    value: String(activeCount),     sub: 'in progress',                          color: '#3B82F6' },
            { label: 'Interviews',         value: String(interviewCount),  sub: `${counts.final_round ?? 0} final round`, color: '#7C3AED' },
            { label: 'Offers',             value: String(offerCount),      sub: `${offerRate}% offer rate`,             color: '#059669' },
            { label: 'Response Rate',      value: `${responseRate}%`,      sub: `${counts.applied ?? 0} awaiting reply`, color: '#D97706' },
            { label: 'Rejected',           value: String(rejectedCount),   sub: `${Math.round((rejectedCount / total) * 100)}% of total`, color: '#EF4444' },
          ].map(s => (
            <div key={s.label} className="perf-card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Weekly activity chart */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 18 }}>
            Applications Over Time <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-mute)', marginLeft: 6 }}>last 8 weeks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {weeklyBuckets.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 600 }}>{b.count}</div>
                <div style={{ width: '100%', height: `${(b.count / maxWeekly) * 80}px`, background: i === weeklyBuckets.length - 1 ? 'var(--accent)' : 'var(--blue-100)', borderRadius: 5, minHeight: 6, transition: 'height .3s' }} />
                <div style={{ fontSize: 9.5, color: 'var(--text-mute)' }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 14 }}>Applications by Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PIPELINE_ORDER.map(s => {
              const meta = STATUS_META[s]
              const c = counts[s] ?? 0
              const pct = Math.round((c / total) * 100)
              return (
                <div key={s}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{meta.label}</span>
                    <span style={{ color: 'var(--text-mute)' }}>{c} <span style={{ opacity: 0.7 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-soft)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 99, transition: 'width .4s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top companies */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 14 }}>Top Companies</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <span>COMPANY</span><span style={{ textAlign: 'center' }}>APPLICATIONS</span><span style={{ textAlign: 'center' }}>LATEST STATUS</span>
            </div>
            {topCompanies.map(c => {
              const meta = STATUS_META[c.latest.status]
              return (
                <div key={c.company} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontSize: 13, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{c.company}</span>
                  <span style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 700 }}>{c.count}</span>
                  <span style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.label}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="perf-right">
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 14 }}>Applications by Portal</div>
          {portalCounts.map(p => {
            const meta = PORTAL_META[p.portal]
            const pct = Math.round((p.count / total) * 100)
            return (
              <div key={p.portal} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{meta.label}</span>
                  <span style={{ color: 'var(--text-mute)' }}>{p.count} · {pct}%</span>
                </div>
                <div style={{ height: 7, background: 'var(--bg-soft)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 99 }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="top-rec">
          <div className="tr-label"><IconSparkle size={12} /> AI INSIGHT</div>
          <div className="tr-title">{insightTitle}</div>
          <p className="tr-text">{insightText}</p>
        </div>

        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 12 }}>Recent Activity</div>
          {recent.map((j, i) => {
            const meta = STATUS_META[j.status]
            return (
              <div key={j.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: meta.color, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>{j.role} <span style={{ color: 'var(--text-mute)', fontWeight: 400 }}>· {j.company}</span></div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><IconClock />{timeAgo(j.createdAt)} · {meta.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Resume Performance ───────────────────────────────────────────────────
function TabResumePerformance() {
  return (
    <div className="perf-layout">
      <div className="perf-main">
        <div className="perf-card">
          <div className="ai-complete-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
            AI ANALYSIS COMPLETE
          </div>
          <div className="perf-hero-score">
            <div className="perf-score-text">
              <h1>ATS Readiness <em>Score.</em></h1>
              <p>Your resume is currently outperforming <b>88% of applicants</b> in the Senior Product Designer segment. We've identified 3 critical gaps in your technical documentation.</p>
            </div>
            <div className="score-ring-big">
              <div className="score-ring-inner">
                <div className="s-pct">94%</div>
                <div className="s-lbl">EXCELLENT</div>
              </div>
            </div>
          </div>
        </div>

        <div className="perf-card">
          <div className="perf-card-title">Performance Progression</div>
          <div className="perf-bars">
            {BARS.map(b => (
              <div key={b.label} className="perf-bar-wrap">
                <div className={`perf-bar${b.current ? ' current' : ''}`} style={{ height: b.h }} />
                <div className="perf-bar-lbl">{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="perf-card">
          <div className="perf-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Keyword Optimization
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-mute)', fontWeight: 400 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />Found</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />Missing</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-mute)', margin: '0 0 14px' }}>Comparing current resume vs. Lead Product Designer role</p>
          <div className="kw-grid">
            {KEYWORDS_FOUND.map(k => <span key={k} className="kw-tag found">{k}</span>)}
            {KEYWORDS_MISSING.map(k => <span key={k} className="kw-tag missing">{k}</span>)}
          </div>
        </div>

        {/* Section scores */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 16 }}>Section-by-Section Score</div>
          {[
            { section: 'Work Experience',  score: 96, note: 'Strong impact statements' },
            { section: 'Skills',           score: 82, note: '4 keywords missing' },
            { section: 'Education',        score: 100, note: 'Complete and relevant' },
            { section: 'Summary',          score: 78, note: 'Add quantified achievements' },
            { section: 'Projects',         score: 70, note: 'Link to live work or GitHub' },
          ].map(s => (
            <div key={s.section} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{s.section}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-mute)', marginLeft: 8 }}>{s.note}</span>
                </div>
                <span style={{ fontWeight: 700, color: s.score >= 90 ? '#059669' : s.score >= 75 ? 'var(--accent)' : '#D97706' }}>{s.score}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-soft)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.score}%`, background: s.score >= 90 ? '#059669' : s.score >= 75 ? 'var(--accent)' : '#D97706', borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="perf-right">
        <div className="perf-card">
          <div className="perf-card-title">Structural Integrity</div>
          <div className="integrity-list">
            {INTEGRITY.map(({ label, ok }) => (
              <div key={label} className="integrity-item">
                <span className="name">{label}</span>
                {ok
                  ? <div className="integrity-check"><IconCheck size={11} /></div>
                  : <div className="integrity-warn">!</div>
                }
              </div>
            ))}
          </div>
          <a href="#" style={{ display: 'block', marginTop: 14, fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>Full Audit Report →</a>
        </div>

        <div className="top-rec">
          <div className="tr-label"><IconSparkle size={12} /> TOP RECOMMENDATIONS</div>
          <div className="tr-title">Impact Analysis</div>
          <p className="tr-text">Quantify the impact in the Lead Product Designer role. Instead of "led team", try "Led a team of 12 to reduce churn by 24%".</p>
        </div>

        <div className="perf-card">
          <div className="perf-card-title">Market Position</div>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>Top 12%</div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 4 }}>among Product Designer profiles</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            {[['Avg. ATS Score', '71%'], ['Your Score', '94%'], ['Top Performers', '96%']].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Market Insights ──────────────────────────────────────────────────────
function TabMarketInsights() {
  const maxSalary = 100
  return (
    <div className="perf-layout">
      <div className="perf-main">
        {/* Market snapshot */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 2 }}>
          {[
            { label: 'Open PM Roles in India',  value: '2,400+', sub: 'as of this week',       color: 'var(--accent)' },
            { label: 'Avg. Salary Increase',    value: '+18%',   sub: 'YoY for senior roles',  color: '#059669' },
            { label: 'Time to Hire (Avg.)',      value: '23 days',sub: 'down from 31 last yr',  color: '#7C3AED' },
          ].map(s => (
            <div key={s.label} className="perf-card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Salary range chart */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 18 }}>Salary Ranges by Role <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-mute)', marginLeft: 6 }}>in LPA</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {SALARY_RANGES.map(s => (
              <div key={s.role}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{s.role}</span>
                  <span style={{ color: 'var(--text-mute)' }}>₹{s.low}–{s.high} LPA <b style={{ color: s.color }}>· ₹{s.median} median</b></span>
                </div>
                <div style={{ height: 10, background: 'var(--bg-soft)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: `${(s.low / maxSalary) * 100}%`, width: `${((s.high - s.low) / maxSalary) * 100}%`, height: '100%', background: s.color, opacity: 0.25, borderRadius: 99 }} />
                  <div style={{ position: 'absolute', left: `${((s.median - 2) / maxSalary) * 100}%`, width: '4%', height: '100%', background: s.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending skills */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 14 }}>
            Trending Skills <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-mute)', marginLeft: 6 }}>YoY job posting growth</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {TRENDING_SKILLS.map((s, i) => (
              <div key={s.skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < TRENDING_SKILLS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.hot && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>🔥 HOT</span>}
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{s.skill}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}><IconTrend />{s.growth}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="perf-right">
        {/* Top hiring */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconBriefcase /> Top Hiring Now</span>
          </div>
          {TOP_HIRING.map((c, i) => (
            <div key={c.company} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < TOP_HIRING.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: c.color, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>{c.company[0]}</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c.company}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-mute)', background: 'var(--bg-soft)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>{c.openings} open</span>
            </div>
          ))}
        </div>

        <div className="top-rec">
          <div className="tr-label"><IconSparkle size={12} /> MARKET ALERT</div>
          <div className="tr-title">AI Skills Premium</div>
          <p className="tr-text">Candidates with LLM/AI skills are commanding 30–45% higher salaries. Adding a GenAI project to your resume could unlock ₹8–15 LPA more.</p>
        </div>

        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 12 }}>Demand vs. Supply</div>
          {[
            { role: 'Senior PM',   demand: 'High',   supply: 'Low',    badge: '#059669' },
            { role: 'PM',         demand: 'High',   supply: 'High',   badge: '#D97706' },
            { role: 'UX Lead',    demand: 'Medium', supply: 'Low',    badge: '#059669' },
            { role: 'Data PM',    demand: 'High',   supply: 'Medium', badge: '#2563EB' },
          ].map(r => (
            <div key={r.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{r.role}</span>
              <span style={{ background: r.badge + '18', color: r.badge, border: `1px solid ${r.badge}40`, borderRadius: 20, padding: '2px 8px', fontWeight: 600, fontSize: 11 }}>
                {r.demand} demand
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Interview Readiness ──────────────────────────────────────────────────
function TabInterviewReadiness() {
  const overall = Math.round(READINESS_AREAS.reduce((s, a) => s + a.score, 0) / READINESS_AREAS.length)
  return (
    <div className="perf-layout">
      <div className="perf-main">
        {/* Readiness hero */}
        <div className="perf-card">
          <div className="ai-complete-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
            READINESS ANALYSIS
          </div>
          <div className="perf-hero-score">
            <div className="perf-score-text">
              <h1>Interview <em>Readiness.</em></h1>
              <p>You're <b>moderately prepared</b> for Senior PM interviews. Your product sense is strong, but technical depth needs work before your next round.</p>
            </div>
            <div className="score-ring-big">
              <div className="score-ring-inner" style={{ '--ring-pct': `${overall}%` } as React.CSSProperties}>
                <div className="s-pct">{overall}%</div>
                <div className="s-lbl">{overall >= 80 ? 'STRONG' : overall >= 65 ? 'MODERATE' : 'NEEDS WORK'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Readiness by area */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 16 }}>Readiness by Area</div>
          {READINESS_AREAS.map(a => (
            <div key={a.area} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{a.area}</span>
                <span style={{ fontWeight: 700, color: a.score >= 80 ? '#059669' : a.score >= 65 ? '#D97706' : '#EF4444' }}>{a.score}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-soft)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${a.score}%`, background: a.score >= 80 ? '#059669' : a.score >= 65 ? '#D97706' : '#EF4444', borderRadius: 99, transition: 'width .5s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Sample questions */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 14 }}>Practice Questions for Your Target Role</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {SAMPLE_QUESTIONS.map((q, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: i < SAMPLE_QUESTIONS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--blue-50)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0, fontWeight: 800, fontSize: 11 }}>{i + 1}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5, fontWeight: 500 }}>{q.q}</p>
                    <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700, background: 'var(--blue-50)', color: 'var(--accent)', border: '1px solid var(--blue-200)', borderRadius: 4, padding: '1px 7px' }}>{q.tag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="perf-right">
        {/* Prep checklist */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 14 }}>Preparation Checklist</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {PREP_CHECKLIST.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < PREP_CHECKLIST.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, background: c.done ? '#059669' : 'var(--bg-soft)', border: c.done ? 'none' : '1.5px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {c.done && <IconCheck size={11} />}
                </div>
                <span style={{ fontSize: 12.5, color: c.done ? 'var(--text-mute)' : 'var(--text)', textDecoration: c.done ? 'line-through' : 'none', fontWeight: c.done ? 400 : 500 }}>{c.item}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{PREP_CHECKLIST.filter(c => c.done).length} of {PREP_CHECKLIST.length} complete</span>
            <div style={{ height: 6, width: 80, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(PREP_CHECKLIST.filter(c => c.done).length / PREP_CHECKLIST.length) * 100}%`, background: 'var(--accent)', borderRadius: 99 }} />
            </div>
          </div>
        </div>

        <div className="top-rec">
          <div className="tr-label"><IconSparkle size={12} /> COACH TIP</div>
          <div className="tr-title">Technical Depth Gap</div>
          <p className="tr-text">Your technical depth score is 55%. Interviewers at Razorpay and Google will probe system design. Study "Designing Data-Intensive Applications" and practice 2 case studies this week.</p>
        </div>

        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 12 }}>Interview Performance</div>
          {[
            { label: 'Mock interviews done',  value: '0',   icon: '🎯' },
            { label: 'Questions practiced',   value: '12',  icon: '📝' },
            { label: 'Avg. response quality', value: 'N/A', icon: '⭐' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 6 }}><span>{s.icon}</span>{s.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{s.value}</span>
            </div>
          ))}
          <button style={{ width: '100%', marginTop: 14, padding: '9px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <IconStar /> Start Mock Interview
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Performance() {
  const [activeTab, setActiveTab] = useState('Resume Performance')

  return (
    <>
      <div className="perf-subtabs">
        {SUBTABS.map(t => (
          <button key={t} className={`perf-subtab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      {activeTab === 'Analytics'            && <TabAnalytics />}
      {activeTab === 'Resume Performance'   && <TabResumePerformance />}
      {activeTab === 'Market Insights'      && <TabMarketInsights />}
      {activeTab === 'Interview Readiness'  && <TabInterviewReadiness />}
    </>
  )
}
