import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useResumes } from '../../hooks/useResumes'
import { useJobApplications } from '../../hooks/useJobApplications'
import { IconDoc, IconBriefcase, IconSend, IconArrowRight } from '../../icons'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const { resumes } = useResumes(user?.id)
  const { jobs } = useJobApplications(user?.id)
  const jobsApplied = jobs.length
  const recentDocs = resumes.slice(0, 10)

  const stats = [
    { icon: <IconDoc size={16} />,       lbl: 'RESUMES CREATED', num: String(resumes.length), delta: resumes.length === 0 ? 'Create your first resume →' : `${recentDocs.length} saved` },
    { icon: <IconBriefcase size={16} />, lbl: 'JOBS APPLIED',    num: String(jobsApplied),  delta: jobsApplied === 0 ? 'Track your first application →' : 'In Job Tracker' },
    { icon: <IconSend size={16} />,      lbl: 'OUTREACH SENT',   num: '0', delta: 'Send your first outreach →' },
  ]

  return (
    <>
      <p className="page-greeting">{greeting()}, {firstName}.</p>
      <p className="page-greeting-sub">
        {resumes.length === 0
          ? 'Welcome to JobEarly! Start by building your first AI-tailored resume.'
          : <>You've tracked <b>{jobsApplied} application{jobsApplied === 1 ? '' : 's'}</b> so far — keep tailoring, keep applying.</>
        }
      </p>

      {/* Stats */}
      <div className="dash-stats">
        {stats.map(({ icon, lbl, num, delta }) => (
          <div key={lbl} className="dash-stat-card">
            <div className="ico-tile">{icon}</div>
            <div className="lbl">{lbl}</div>
            <div className="num">{num}</div>
            <div className="delta">{delta}</div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="dash-bottom">
        {/* Recent activity */}
        <div className="dash-section">
          <div className="dash-section-head">
            <h4>Recent Activity</h4>
            {recentDocs.length > 0 && <Link to="/app/resume-builder">View All Documents</Link>}
          </div>

          {recentDocs.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><IconDoc size={22} /></div>
              <div className="dash-empty-title">No resumes yet</div>
              <div className="dash-empty-sub">Create your first AI-tailored resume and it will appear here.</div>
              <Link to="/app/resume-builder" className="btn btn-primary btn-sm" style={{ marginTop: 14, display: 'inline-flex' }}>
                Build Resume <IconArrowRight size={13} />
              </Link>
            </div>
          ) : (
            recentDocs.map(({ title, savedAt, atsScore }, i) => (
              <div key={`${title}-${i}`} className="activity-row">
                <div className="doc-ico"><IconDoc size={15} /></div>
                <div>
                  <div className="ttl">{title}</div>
                  <div className="meta">{timeAgo(savedAt)} · {atsScore}% ATS Match</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
