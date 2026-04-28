import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { IconDoc, IconSparkle, IconSend } from '../../icons'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const recentDocs = [
  { title: 'Product Designer — Google.pdf',  meta: '2 hours ago · 98% ATS Match' },
  { title: 'UX Architect — Airbnb.pdf',      meta: 'Yesterday · 94% ATS Match' },
  { title: 'Senior Designer — Stripe.pdf',   meta: '3 days ago · 89% ATS Match' },
]

const recommended = [
  {
    role: 'Staff Product Designer', company: 'Figma · Remote', badge: '★ AI PICK',
    desc: 'Your experience with design systems matches 94% of this role\'s core requirements.',
    logo: '#0F172A',
  },
  {
    role: 'Design Architect', company: 'Canva · Hybrid', badge: null,
    desc: 'Aligns with your salary preference of $180k+ and focus on visual excellence.',
    logo: '#7C3AED',
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <>
      <p className="page-greeting">{greeting()}, {firstName}.</p>
      <p className="page-greeting-sub">
        Your AI career architect has identified <b>12 new matches</b> aligned with your {user?.jobTitle ?? 'career'} trajectory.
      </p>

      {/* Stats */}
      <div className="dash-stats">
        {[
          { icon: <IconDoc size={16} />,     lbl: 'RESUMES CREATED', num: '24',  delta: '+12% from last month' },
          { icon: <IconSparkle size={16} />, lbl: 'JOBS MATCHED',    num: '142', delta: '8 High-Probability Leads' },
          { icon: <IconSend size={16} />,    lbl: 'OUTREACH SENT',   num: '38',  delta: '15 Responses received' },
        ].map(({ icon, lbl, num, delta }) => (
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
            <Link to="/app/resume-builder">View All Documents</Link>
          </div>
          {recentDocs.map(({ title, meta }) => (
            <div key={title} className="activity-row">
              <div className="doc-ico"><IconDoc size={15} /></div>
              <div>
                <div className="ttl">{title}</div>
                <div className="meta">{meta}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended */}
        <div className="dash-section">
          <div className="dash-section-head">
            <h4>Recommended</h4>
            <Link to="/app/job-match">Explore More</Link>
          </div>
          {recommended.map(({ role, company, badge, desc, logo }) => (
            <div key={role} className="rec-card">
              <div className="rec-card-head">
                <div className="co-logo" style={{ background: logo }} />
                <div>
                  <div className="role">{role}</div>
                  <div className="co">{company}</div>
                </div>
                {badge && <div className="ai-badge">{badge}</div>}
              </div>
              <div className="desc">{desc}</div>
              <Link to="/app/job-match" className="rec-apply">Apply with AI Tailoring</Link>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
