import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { IconSparkle, IconUser, IconDoc, IconUndo, IconRedo, IconDownload, IconShare, IconCustomize, IconZoomIn, IconZoomOut } from '../../icons'

export default function ResumeBuilder() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(
    `Strategic ${user?.jobTitle ?? 'Product Designer'} with 8+ years of experience in creating human-centric digital experiences. Proven track record of leading design systems for Fortune 500 fintech companies, resulting in increased operational efficiency and user satisfaction across multiple platforms.`
  )
  const [name, setName] = useState(user?.name ?? 'Alexander Thorne')
  const [title, setTitle] = useState(user?.jobTitle ?? 'Senior Product Designer')

  return (
    <div className="builder-layout">
      {/* ── Left Panel ── */}
      <div className="builder-left">
        <div>
          <h2 className="builder-title">Career Architect</h2>
          <p className="builder-sub">Refine your professional narrative with our AI-augmented editor. Precision matters.</p>
        </div>

        {/* AI Insight */}
        <div className="ai-insight">
          <div className="ai-label"><IconSparkle size={12} /> AI INSIGHT</div>
          <p>Your professional summary lacks quantitative metrics. Consider adding percentages or dollar amounts to demonstrate impact.</p>
          <div className="ai-insight-btns">
            <button>+ Suggest Metric</button>
            <button>Optimize Tone</button>
          </div>
        </div>

        {/* Personal Info */}
        <div>
          <div className="form-section-head"><IconUser size={14} /> Personal Information</div>
          <div className="form-grid">
            <div>
              <div className="f-label">Full Name</div>
              <input className="f-input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <div className="f-label">Job Title</div>
              <input className="f-input" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <div className="f-label">Email</div>
              <input className="f-input" defaultValue={user?.email ?? 'alex@example.com'} />
            </div>
            <div>
              <div className="f-label">Location</div>
              <input className="f-input" defaultValue="San Francisco, CA" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="f-label">LinkedIn</div>
              <input className="f-input" defaultValue="linkedin.com/in/thorne" />
            </div>
          </div>
        </div>

        {/* Professional Summary */}
        <div>
          <div className="form-section-head" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconDoc size={14} /> Professional Summary</span>
            <span className="regen-link">Regenerate with AI</span>
          </div>
          <textarea className="f-textarea" value={summary} onChange={e => setSummary(e.target.value)} rows={5} />
        </div>

        {/* Bottom bar */}
        <div className="builder-bottom-bar">
          <div className="undo-redo">
            <button title="Undo"><IconUndo size={13} /></button>
            <button title="Redo"><IconRedo size={13} /></button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ height: 38, padding: '0 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-soft)', fontSize: 13, cursor: 'pointer' }}>
              Save Draft
            </button>
            <button className="btn-download"><IconDownload size={13} /> Download PDF</button>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="builder-right">
        <div className="builder-right-head">
          <div className="template-tag">
            TEMPLATE: <strong>EDITORIAL PRO</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-mute)', fontSize: 13 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'flex', alignItems: 'center' }}><IconZoomOut size={15} /></button>
            <span>85%</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'flex', alignItems: 'center' }}><IconZoomIn size={15} /></button>
          </div>
          <div className="builder-actions">
            <button><IconCustomize size={13} /> Customize</button>
            <button><IconShare size={13} /> Share</button>
          </div>
        </div>

        {/* Resume Preview */}
        <div className="resume-preview">
          <div className="resume-doc">
            <div className="resume-doc-head">
              <div className="rname">{name}</div>
              <div className="rtitle">{title}</div>
              <div className="rcontact">{user?.email ?? 'alex.thorne@jobearly.ai'} · SAN FRANCISCO, CA · +1 415 555 0123 · LINKEDIN.COM/IN/THORNE</div>
            </div>
            <div className="resume-doc-body">
              {/* Left column */}
              <div className="resume-col">
                <div className="resume-sec-title">Core Expertise</div>
                {['UI/UX Strategy', 'Design Systems', 'Framer / React', 'User Research', 'Prototyping'].map(s => (
                  <span key={s} className="resume-skill">{s}</span>
                ))}
                <div className="resume-sec-title" style={{ marginTop: 18 }}>Education</div>
                <div className="resume-entry">
                  <div className="title">BFA Interaction Design</div>
                  <div className="sub">Rhode Island School of Design</div>
                  <div className="sub">2012 — 2016</div>
                </div>
              </div>
              {/* Right column */}
              <div className="resume-col">
                <div className="resume-sec-title">Professional Summary</div>
                <p style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.6, marginBottom: 14 }}>{summary}</p>
                <div className="resume-sec-title">Work Experience</div>
                <div className="resume-entry">
                  <div className="title">Lead Designer</div>
                  <div className="sub" style={{ color: '#2563eb', fontWeight: 600 }}>FinTech Global</div>
                  <div className="sub">2020 — PRESENT</div>
                  <ul>
                    <li>Spearheaded the redesign of the mobile banking app, resulting in a 40% increase in user retention and a 4.8 App Store rating.</li>
                    <li>Managed a cross-functional team of 12 designers and researchers, establishing a unified language system.</li>
                  </ul>
                </div>
                <div className="resume-entry">
                  <div className="title">Senior UX Designer</div>
                  <div className="sub" style={{ color: '#2563eb', fontWeight: 600 }}>DataViz Corp</div>
                  <div className="sub">2017 — 2020</div>
                  <ul>
                    <li>Designed end-to-end data visualization dashboards used by 200K+ enterprise customers globally.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
