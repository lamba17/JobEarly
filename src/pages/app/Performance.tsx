import { useState } from 'react'
import { IconCheck, IconSparkle } from '../../icons'

const SUBTABS = ['Analytics', 'Resume Performance', 'Market Insights', 'Interview Readiness']

const KEYWORDS_FOUND   = ['Product Strategy', 'User Research', 'Figma Master', 'Agile Methodology']
const KEYWORDS_MISSING = ['Kubernetes', 'A/B Testing']

const INTEGRITY = [
  { label: 'Contact Headers',      ok: true  },
  { label: 'Section Hierarchy',    ok: true  },
  { label: 'File Metadata',        ok: true  },
  { label: 'Optimal Length (1 Page)', ok: false },
  { label: 'Standard Font Usage',  ok: true  },
]

const BARS = [
  { label: 'VER. 1.0', h: 35 },
  { label: 'VER. 1.2', h: 55 },
  { label: 'VER. 2.0', h: 72 },
  { label: 'CURRENT',  h: 94, current: true },
]

export default function Performance() {
  const [activeTab, setActiveTab] = useState('Resume Performance')

  return (
    <>
      {/* Subtabs */}
      <div className="perf-subtabs">
        {SUBTABS.map(t => (
          <button key={t} className={`perf-subtab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      <div className="perf-layout">
        {/* ── Main ── */}
        <div className="perf-main">
          {/* Score hero */}
          <div className="perf-card">
            <div className="ai-complete-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
              AI ANALYSIS COMPLETE
            </div>
            <div className="perf-hero-score">
              <div className="perf-score-text">
                <h1>ATS Readiness <em>Score.</em></h1>
                <p>
                  Your resume is currently outperforming <b>88% of applicants</b> in the Senior Product Designer segment.
                  We've identified 3 critical gaps in your technical documentation.
                </p>
              </div>
              <div className="score-ring-big">
                <div className="score-ring-inner">
                  <div className="s-pct">94%</div>
                  <div className="s-lbl">EXCELLENT</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance progression */}
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

          {/* Keyword optimization */}
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
        </div>

        {/* ── Right sidebar ── */}
        <div className="perf-right">
          {/* Structural integrity */}
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

          {/* Top recommendations */}
          <div className="top-rec">
            <div className="tr-label"><IconSparkle size={12} /> TOP RECOMMENDATIONS</div>
            <div className="tr-title">Impact Analysis</div>
            <p className="tr-text">
              Quantify the impact in the Lead Product Designer role. Instead of "led team", try
              "Led a team of 12 to reduce churn by 24%".
            </p>
          </div>

          {/* Market position */}
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
    </>
  )
}
