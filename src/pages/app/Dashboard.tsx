import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUserData } from '../../lib/userStore'
import { IconDoc, IconSparkle, IconSend, IconArrowRight } from '../../icons'

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
  const data = user ? getUserData(user.email) : { resumes: 0, jobsApplied: 0, outreach: 0, recentDocs: [] }

  const stats = [
    { icon: <IconDoc size={16} />,     lbl: 'RESUMES CREATED', num: String(data.resumes),     delta: data.resumes === 0 ? 'Create your first resume →' : `${data.recentDocs.length} saved` },
    { icon: <IconSparkle size={16} />, lbl: 'JOBS MATCHED',    num: String(data.jobsApplied), delta: data.jobsApplied === 0 ? 'Explore job matches →' : 'High-probability leads' },
    { icon: <IconSend size={16} />,    lbl: 'OUTREACH SENT',   num: String(data.outreach),    delta: data.outreach === 0 ? 'Send your first outreach →' : 'Responses received' },
  ]

  return (
    <>
      <p className="page-greeting">{greeting()}, {firstName}.</p>
      <p className="page-greeting-sub">
        {data.resumes === 0
          ? 'Welcome to JobEarly! Start by building your first AI-tailored resume.'
          : <>Your AI career architect has identified <b>12 new matches</b> aligned with your {user?.jobTitle ?? 'career'} trajectory.</>
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
            {data.recentDocs.length > 0 && <Link to="/app/resume-builder">View All Documents</Link>}
          </div>

          {data.recentDocs.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><IconDoc size={22} /></div>
              <div className="dash-empty-title">No resumes yet</div>
              <div className="dash-empty-sub">Create your first AI-tailored resume and it will appear here.</div>
              <Link to="/app/resume-builder" className="btn btn-primary btn-sm" style={{ marginTop: 14, display: 'inline-flex' }}>
                Build Resume <IconArrowRight size={13} />
              </Link>
            </div>
          ) : (
            data.recentDocs.map(({ title, savedAt, atsScore }) => (
              <div key={title} className="activity-row">
                <div className="doc-ico"><IconDoc size={15} /></div>
                <div>
                  <div className="ttl">{title}</div>
                  <div className="meta">{timeAgo(savedAt)} · {atsScore}% ATS Match</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recommended */}
        <div className="dash-section">
          <div className="dash-section-head">
            <h4>Recommended for You</h4>
            <Link to="/app/job-match">Explore More</Link>
          </div>

          {data.resumes === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><IconSparkle size={22} /></div>
              <div className="dash-empty-title">No recommendations yet</div>
              <div className="dash-empty-sub">Build a resume first so we can match you to the best roles.</div>
              <Link to="/app/job-match" className="btn btn-soft btn-sm" style={{ marginTop: 14, display: 'inline-flex' }}>
                Browse Jobs <IconArrowRight size={13} />
              </Link>
            </div>
          ) : (
            [
              { role: 'Staff Product Designer', company: 'Figma · Remote', badge: '★ AI PICK', desc: 'Your design systems experience matches 94% of this role\'s core requirements.', logo: '#0F172A' },
              { role: 'Design Architect', company: 'Canva · Hybrid', badge: null, desc: 'Aligns with your salary preference and focus on visual excellence.', logo: '#7C3AED' },
            ].map(({ role, company, badge, desc, logo }) => (
              <div key={role} className="rec-card">
                <div className="rec-card-head">
                  <div className="co-logo" style={{ background: logo }} />
                  <div><div className="role">{role}</div><div className="co">{company}</div></div>
                  {badge && <div className="ai-badge">{badge}</div>}
                </div>
                <div className="desc">{desc}</div>
                <Link to="/app/job-match" className="rec-apply">Apply with AI Tailoring</Link>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
