import { Link } from 'react-router-dom'
import { IconSparkle } from '../../icons'
import { useAuth } from '../../context/AuthContext'
import { loadJobs, STATUS_META, PORTAL_META, ALL_STATUSES, ALL_PORTALS, type JobApplication, type Status } from '../../lib/jobTracker'

// ── Shared helpers ────────────────────────────────────────────────────────────
function IconClock() {
  return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}

// ── Analytics ────────────────────────────────────────────────────────────────
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

// ── Main export ───────────────────────────────────────────────────────────────
export default function Performance() {
  const { user } = useAuth()
  const jobs = loadJobs(user?.email)
  const total = jobs.length

  if (total === 0) {
    return (
      <div className="perf-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>📊</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>No application data yet</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-mute)', marginBottom: 22, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
          Track your applications in Job Tracker and this page will fill up with real trends — status breakdowns, portal performance, and weekly activity.
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
