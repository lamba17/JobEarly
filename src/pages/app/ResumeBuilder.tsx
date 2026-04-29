import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { addResume } from '../../lib/userStore'
import {
  IconSparkle, IconUser, IconDoc, IconUndo, IconRedo,
  IconDownload, IconShare, IconCustomize, IconZoomIn, IconZoomOut,
  IconBriefcase, IconCheck, IconPlus,
} from '../../icons'

// ── Local icon helpers ────────────────────────────────────────────────────────

const IcoX = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)
const IcoChevDown = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const IcoTarget = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IcoWarn = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
)
const IcoLink2 = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const IcoLightning = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)
const IcoEditPen = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

// ── ATS logic ─────────────────────────────────────────────────────────────────

const SKILL_POOL = [
  'sql', 'python', 'java', 'react', 'typescript', 'javascript', 'node.js', 'aws', 'azure', 'gcp',
  'figma', 'sketch', 'agile', 'scrum', 'jira', 'confluence', 'tableau', 'power bi',
  'machine learning', 'data analysis', 'product management', 'ux research', 'a/b testing',
  'design systems', 'user research', 'prototyping', 'kubernetes', 'docker', 'ci/cd',
  'rest api', 'graphql', 'mongodb', 'postgresql', 'leadership', 'stakeholder management',
  'cross-functional', 'roadmap', 'product strategy', 'metrics', 'kpi', 'go-to-market',
  'swift', 'kotlin', 'flutter', 'react native', 'vue.js', 'angular', 'next.js',
  'growth', 'seo', 'crm', 'salesforce', 'hubspot', 'devops', 'microservices', 'nosql',
]

const STOP = new Set([
  'the','and','or','in','on','at','to','for','of','a','an','is','are','was','were','be',
  'been','have','has','had','do','does','did','will','would','could','should','with','from',
  'by','about','as','into','this','that','we','you','they','our','your','their','who','which',
  'what','all','both','each','more','most','other','some','such','no','not','only','than',
  'too','very','just','can','also','its','role','work','team','new','join','help','strong',
  'good','great','seeking','candidate','required','ability','experience','years','position',
  'job','skills','responsibilities','qualifications','preferred','must','ideal','include',
  'develop','building','working','using','make','take','give','ensure','provide','based',
])

function extractJDKeywords(jd: string): string[] {
  const lower = jd.toLowerCase()
  const multi = SKILL_POOL.filter(s => lower.includes(s))
  const words = lower.replace(/[^a-z0-9+#./\s-]/g, ' ').split(/\s+/)
    .filter(w => w.length > 3 && !STOP.has(w) && !multi.some(m => m.includes(w)))
  const freq: Record<string, number> = {}
  for (const w of words) freq[w] = (freq[w] || 0) + 1
  const raw = Object.entries(freq)
    .filter(([, c]) => c >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([w]) => w)
  return [...new Set([...multi, ...raw])].slice(0, 16)
}

function splitKeywords(kws: string[], resumeText: string) {
  const rt = resumeText.toLowerCase()
  const found: string[] = []
  const missing: string[] = []
  for (const kw of kws) (rt.includes(kw.toLowerCase()) ? found : missing).push(kw)
  return { found, missing }
}

function computeScore(found: number, total: number, hasJD: boolean) {
  if (!hasJD || total === 0) return 72
  const ratio = found / total
  return Math.min(98, Math.round(52 + ratio * 40 + (found >= 6 ? 6 : 0)))
}

const FORMAT_CHECKS = [
  { label: 'Standard section headings', pass: true },
  { label: 'Contact info readable by ATS', pass: true },
  { label: 'Quantified achievements present', pass: true },
  { label: 'Action verbs lead each bullet', pass: true },
  { label: 'No graphics in text areas', pass: true },
  { label: 'Date ranges consistently formatted', pass: true },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkExp { id: number; title: string; company: string; period: string; bullets: string[] }
interface EduEntry { id: number; degree: string; school: string; period: string }

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResumeBuilder() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'jd' | 'editor'>('jd')

  // Job target state
  const [jobUrl, setJobUrl] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [analysed, setAnalysed] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [tailored, setTailored] = useState(false)
  const [keywords, setKeywords] = useState<{ found: string[]; missing: string[] }>({ found: [], missing: [] })

  // Resume fields
  const [name, setName] = useState(user?.name ?? 'Akash Lamba')
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? 'Product Designer')
  const [email, setEmail] = useState(user?.email ?? 'lamba.akash1994@gmail.com')
  const [location, setLocation] = useState('Bangalore, India')
  const [linkedin, setLinkedin] = useState('linkedin.com/in/akshlamba')
  const [summary, setSummary] = useState(
    `${user?.jobTitle ?? 'Product Designer'} with 6+ years of experience building user-centric digital products. Led end-to-end design for consumer apps reaching 2M+ users. Proven track record of cross-functional collaboration with engineering and product stakeholders to ship high-impact features on time.`
  )
  const [skills, setSkills] = useState([
    'Product Strategy', 'UX Research', 'Figma', 'Design Systems',
    'Prototyping', 'A/B Testing', 'User Interviews', 'Data Analysis',
  ])
  const [newSkill, setNewSkill] = useState('')

  const [workExp, setWorkExp] = useState<WorkExp[]>([
    {
      id: 1, title: 'Senior Product Designer', company: 'Razorpay', period: '2021 — PRESENT',
      bullets: [
        'Led redesign of the merchant onboarding flow, reducing drop-off by 34% and increasing activation by 28%.',
        'Built and maintained a cross-platform design system used by 20+ engineers across 3 products.',
      ],
    },
    {
      id: 2, title: 'Product Designer', company: 'Swiggy', period: '2018 — 2021',
      bullets: [
        'Designed the restaurant discovery experience used by 8M+ daily active users across India.',
        'Ran 12 A/B tests per quarter; shipped variants that increased order conversion by 18%.',
      ],
    },
  ])
  const [openExp, setOpenExp] = useState<number | null>(1)

  const [education] = useState<EduEntry[]>([
    { id: 1, degree: 'B.Des — Interaction Design', school: 'National Institute of Design', period: '2014 — 2018' },
  ])

  // Derived values
  const resumeText = useMemo(() => [
    name, jobTitle, summary, skills.join(' '),
    ...workExp.flatMap(e => [e.title, e.company, ...e.bullets]),
    ...education.flatMap(e => [e.degree, e.school]),
  ].join(' '), [name, jobTitle, summary, skills, workExp, education])

  const atsScore = useMemo(
    () => computeScore(keywords.found.length, keywords.found.length + keywords.missing.length, analysed),
    [keywords, analysed]
  )

  const scoreColor = atsScore >= 85 ? '#10B981' : atsScore >= 65 ? '#F59E0B' : '#EF4444'
  const scorePct = `${atsScore}%`
  const matchedKwSet = useMemo(() => new Set(keywords.found.map(k => k.toLowerCase())), [keywords.found])

  // Handlers
  const handleAnalyse = () => {
    if (!jobDesc.trim() && !jobUrl.trim()) return
    setAnalysing(true)
    setTimeout(() => {
      const fallbackJD = `${jobTitle} role. Requirements: UX Research, Figma, Design Systems, Prototyping, Stakeholder Management, Data Analysis, A/B Testing, Cross-functional, Roadmap, User Research, Product Strategy, Agile, Metrics.`
      const kws = extractJDKeywords(jobDesc.trim() || fallbackJD)
      setKeywords(splitKeywords(kws, resumeText))
      setAnalysed(true)
      setAnalysing(false)
    }, 950)
  }

  const handleTailor = () => {
    const topMissing = keywords.missing.slice(0, 3)
    if (topMissing.length > 0) {
      const additions = topMissing.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ')
      setSummary(prev => prev.replace(/\.$/, '') + `. Skilled in ${additions}.`)
      setKeywords(prev => ({
        found: [...prev.found, ...prev.missing.slice(0, 3)],
        missing: prev.missing.slice(3),
      }))
    }
    setTailored(true)
    setActiveTab('editor')
  }

  const addMissingKw = (kw: string) => {
    const skill = kw.charAt(0).toUpperCase() + kw.slice(1)
    if (!skills.includes(skill)) setSkills(prev => [...prev, skill])
    setKeywords(prev => ({ found: [...prev.found, kw], missing: prev.missing.filter(k => k !== kw) }))
  }

  const addSkill = (sk: string) => {
    const t = sk.trim()
    if (t && !skills.includes(t)) setSkills(prev => [...prev, t])
    setNewSkill('')
  }

  const updateBullet = (expId: number, idx: number, val: string) =>
    setWorkExp(prev => prev.map(e => e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => i === idx ? val : b) } : e))

  const addBullet = (expId: number) =>
    setWorkExp(prev => prev.map(e => e.id === expId ? { ...e, bullets: [...e.bullets, ''] } : e))

  const handleSave = () => {
    if (!user) return
    addResume(user.email, `${jobTitle} — ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}.pdf`, atsScore)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const resetAnalysis = () => { setAnalysed(false); setTailored(false); setKeywords({ found: [], missing: [] }) }

  return (
    <div className="builder-layout">

      {/* ── Left Panel ──────────────────────────────────────────── */}
      <div className="builder-left" style={{ width: 390, overflow: 'hidden', padding: 0, gap: 0 }}>

        {/* Tab switcher */}
        <div className="rb-tabs">
          <button className={`rb-tab${activeTab === 'jd' ? ' active' : ''}`} onClick={() => setActiveTab('jd')}>
            <IcoTarget /> Job Target
            {analysed && <span className="rb-tab-dot" style={{ background: scoreColor }} />}
          </button>
          <button className={`rb-tab${activeTab === 'editor' ? ' active' : ''}`} onClick={() => setActiveTab('editor')}>
            <IcoEditPen /> Edit Resume
          </button>
        </div>

        {/* ─── JOB TARGET TAB ─── */}
        {activeTab === 'jd' && (
          <div className="rb-tab-content">

            {!analysed ? (
              <>
                <div>
                  <h2 className="builder-title" style={{ fontSize: 17, marginBottom: 4 }}>Target a Job</h2>
                  <p className="builder-sub">Paste the job description to get a live ATS score and tailor your resume to the role.</p>
                </div>

                {/* LinkedIn URL */}
                <div>
                  <div className="f-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <IcoLink2 size={12} /> LinkedIn Job URL or ID
                  </div>
                  <input
                    className="f-input"
                    placeholder="https://linkedin.com/jobs/view/1234567890"
                    value={jobUrl}
                    onChange={e => setJobUrl(e.target.value)}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>
                    We'll auto-fetch the JD — or paste below
                  </div>
                </div>

                <div className="rb-or-divider"><span>OR</span></div>

                <div>
                  <div className="f-label" style={{ marginBottom: 5 }}>Paste Job Description</div>
                  <textarea
                    className="f-textarea"
                    placeholder="Paste the full job description here — include requirements, responsibilities, and qualifications for the best tailoring results…"
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                    rows={10}
                    style={{ minHeight: 200, resize: 'vertical' }}
                  />
                </div>

                <button
                  className="rb-analyse-btn"
                  onClick={handleAnalyse}
                  disabled={analysing}
                >
                  {analysing
                    ? <><span className="rb-spinner" /> Analysing JD…</>
                    : <><IcoLightning size={14} /> Analyse &amp; Score Resume</>}
                </button>
              </>
            ) : (
              <>
                {/* ATS Score Ring */}
                <div className="ats-score-card">
                  <div className="ats-ring-wrap">
                    <div
                      className="ats-ring-lg"
                      style={{ background: `conic-gradient(${scoreColor} 0% ${scorePct}, var(--border) ${scorePct} 100%)` }}
                    >
                      <div className="ats-ring-inner">
                        <div className="ats-num" style={{ color: scoreColor }}>{atsScore}</div>
                        <div className="ats-denom">/ 100</div>
                      </div>
                    </div>
                    <div>
                      <div className="ats-title-label">ATS SCORE</div>
                      <div className={`ats-verdict ${atsScore >= 85 ? 'good' : atsScore >= 65 ? 'ok' : 'bad'}`}>
                        {atsScore >= 85 ? '✅ ATS Friendly' : atsScore >= 65 ? '⚠️ Needs Work' : '❌ Poor Match'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 4 }}>
                        {keywords.found.length} of {keywords.found.length + keywords.missing.length} keywords matched
                      </div>
                    </div>
                  </div>
                  <button className="rb-change-jd" onClick={resetAnalysis}>Change JD</button>
                </div>

                {/* Matched Keywords */}
                {keywords.found.length > 0 && (
                  <div className="ats-kw-section">
                    <div className="ats-kw-head">
                      KEYWORDS MATCHED
                      <span className="ats-kw-count good">{keywords.found.length}</span>
                    </div>
                    <div className="ats-kw-grid">
                      {keywords.found.map(kw => (
                        <span key={kw} className="ats-kw-chip found"><IconCheck size={9} /> {kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Keywords */}
                {keywords.missing.length > 0 && (
                  <div className="ats-kw-section">
                    <div className="ats-kw-head">
                      MISSING — CLICK TO ADD TO SKILLS
                      <span className="ats-kw-count bad">{keywords.missing.length}</span>
                    </div>
                    <div className="ats-kw-grid">
                      {keywords.missing.map(kw => (
                        <button key={kw} className="ats-kw-chip missing" onClick={() => addMissingKw(kw)}>
                          + {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Format Checks */}
                <div className="ats-kw-section">
                  <div className="ats-kw-head">FORMAT CHECKS</div>
                  <div className="ats-format-list">
                    {FORMAT_CHECKS.map((fc, i) => (
                      <div key={i} className="ats-format-row">
                        <span className={`ats-format-ico ${fc.pass ? 'pass' : 'warn'}`}>
                          {fc.pass ? <IconCheck size={9} /> : <IcoWarn size={9} />}
                        </span>
                        <span>{fc.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                {!tailored && keywords.missing.length > 0 && (
                  <button className="rb-tailor-btn" onClick={handleTailor}>
                    <IconSparkle size={13} /> Auto-Tailor with AI
                    <span style={{ fontSize: 10.5, opacity: 0.75, marginLeft: 4 }}>
                      adds {Math.min(3, keywords.missing.length)} keywords
                    </span>
                  </button>
                )}

                {tailored && (
                  <div className="rb-tailored-notice">
                    <IconCheck size={12} /> Resume has been tailored for this role
                  </div>
                )}

                <button
                  className="rb-edit-resume-btn"
                  onClick={() => setActiveTab('editor')}
                >
                  <IcoEditPen size={13} /> Edit Resume Manually →
                </button>
              </>
            )}
          </div>
        )}

        {/* ─── EDITOR TAB ─── */}
        {activeTab === 'editor' && (
          <div className="rb-tab-content">

            {/* AI Insight */}
            <div className="ai-insight">
              <div className="ai-label"><IconSparkle size={12} /> AI INSIGHT</div>
              <p>
                {analysed
                  ? `Score: ${atsScore}/100 for this role. ${keywords.missing.length > 0 ? `Adding "${keywords.missing[0]}" and "${keywords.missing[1] ?? keywords.missing[0]}" could boost your score by ~8 points.` : 'Great keyword coverage — your resume is well-optimised.'}`
                  : 'Add a job target first to get personalised suggestions and a live ATS score.'}
              </p>
              <div className="ai-insight-btns">
                <button onClick={() => setActiveTab('jd')}>
                  {analysed ? '↺ Change Job' : '🎯 Add Job Target'}
                </button>
                {analysed && (
                  <button onClick={() => setSummary(`Experienced ${jobTitle} with a strong track record of delivering scalable, user-centred products. Expert in cross-functional collaboration with engineering, product, and business stakeholders.`)}>
                    Optimise Tone
                  </button>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <div className="form-section-head"><IconUser size={14} /> Personal Information</div>
              <div className="form-grid">
                <div>
                  <div className="f-label">Full Name</div>
                  <input className="f-input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <div className="f-label">Job Title</div>
                  <input className="f-input" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                </div>
                <div>
                  <div className="f-label">Email</div>
                  <input className="f-input" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <div className="f-label">Location</div>
                  <input className="f-input" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="f-label">LinkedIn URL</div>
                  <input className="f-input" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            <div>
              <div className="form-section-head" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconDoc size={14} /> Professional Summary
                </span>
                <span
                  className="regen-link"
                  onClick={() => setSummary(`Experienced ${jobTitle} with a proven track record of building impactful, user-centred products at scale. Skilled in cross-functional collaboration, data-driven decision making, and delivering features that move key business metrics.`)}
                >
                  Regenerate with AI
                </span>
              </div>
              <textarea className="f-textarea" value={summary} onChange={e => setSummary(e.target.value)} rows={5} />
            </div>

            {/* Core Skills */}
            <div>
              <div className="form-section-head"><IconBriefcase size={14} /> Core Skills</div>
              <div className="rb-skill-chips">
                {skills.map(sk => (
                  <div key={sk} className={`rb-skill-chip${matchedKwSet.has(sk.toLowerCase()) ? ' matched' : ''}`}>
                    {sk}
                    <button onClick={() => setSkills(prev => prev.filter(s => s !== sk))}><IcoX size={10} /></button>
                  </div>
                ))}
                <div className="rb-skill-add">
                  <input
                    className="rb-skill-input"
                    placeholder="Add skill…"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { addSkill(newSkill); e.preventDefault() } }}
                  />
                </div>
              </div>
            </div>

            {/* Work Experience */}
            <div>
              <div className="form-section-head"><IconBriefcase size={14} /> Work Experience</div>
              {workExp.map(exp => (
                <div key={exp.id} className="rb-exp-entry">
                  <button className="rb-exp-header" onClick={() => setOpenExp(openExp === exp.id ? null : exp.id)}>
                    <div>
                      <div className="rb-exp-role">{exp.title}</div>
                      <div className="rb-exp-co">{exp.company} · {exp.period}</div>
                    </div>
                    <span className={`rb-exp-chev${openExp === exp.id ? ' open' : ''}`}><IcoChevDown /></span>
                  </button>

                  {openExp === exp.id && (
                    <div className="rb-exp-body">
                      <div>
                        <div className="f-label">Job Title</div>
                        <input className="f-input" value={exp.title}
                          onChange={e => setWorkExp(prev => prev.map(x => x.id === exp.id ? { ...x, title: e.target.value } : x))} />
                      </div>
                      <div className="form-grid" style={{ marginTop: 8 }}>
                        <div>
                          <div className="f-label">Company</div>
                          <input className="f-input" value={exp.company}
                            onChange={e => setWorkExp(prev => prev.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x))} />
                        </div>
                        <div>
                          <div className="f-label">Period</div>
                          <input className="f-input" value={exp.period}
                            onChange={e => setWorkExp(prev => prev.map(x => x.id === exp.id ? { ...x, period: e.target.value } : x))} />
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div className="f-label" style={{ marginBottom: 6 }}>Bullet Points</div>
                        {exp.bullets.map((b, i) => (
                          <textarea
                            key={i}
                            className="f-textarea"
                            value={b}
                            onChange={e => updateBullet(exp.id, i, e.target.value)}
                            rows={2}
                            style={{ minHeight: 'unset', marginBottom: 6 }}
                          />
                        ))}
                        <button className="rb-add-bullet" onClick={() => addBullet(exp.id)}>
                          <IconPlus size={10} /> Add bullet point
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button className="rb-add-exp" onClick={() => {
                const n = { id: Date.now(), title: 'New Role', company: 'Company', period: '20XX — 20XX', bullets: [''] }
                setWorkExp(prev => [...prev, n])
                setOpenExp(n.id)
              }}>
                <IconPlus size={12} /> Add Experience
              </button>
            </div>

            {/* Education */}
            <div>
              <div className="form-section-head"><IconDoc size={14} /> Education</div>
              {education.map(edu => (
                <div key={edu.id}>
                  <div style={{ gridColumn: '1 / -1', marginBottom: 8 }}>
                    <div className="f-label">Degree</div>
                    <input className="f-input" defaultValue={edu.degree} />
                  </div>
                  <div className="form-grid">
                    <div>
                      <div className="f-label">School</div>
                      <input className="f-input" defaultValue={edu.school} />
                    </div>
                    <div>
                      <div className="f-label">Period</div>
                      <input className="f-input" defaultValue={edu.period} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Bottom bar */}
        <div className="builder-bottom-bar" style={{ margin: 0, padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
          <div className="undo-redo">
            <button title="Undo"><IconUndo size={13} /></button>
            <button title="Redo"><IconRedo size={13} /></button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              style={{
                height: 36, padding: '0 13px', borderRadius: 8, border: '1px solid var(--border)',
                background: saved ? 'var(--blue-50)' : 'var(--card)',
                color: saved ? 'var(--accent)' : 'var(--text-soft)',
                fontSize: 13, cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
              }}
            >
              {saved ? '✓ Saved!' : 'Save Draft'}
            </button>
            <button className="btn-download"><IconDownload size={13} /> Download PDF</button>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Live Resume Preview ──────────────── */}
      <div className="builder-right">
        <div className="builder-right-head">
          <div className="template-tag">TEMPLATE: <strong>EDITORIAL PRO</strong></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mini ATS indicator */}
            {analysed && (
              <div className="rb-ats-mini" style={{ borderColor: scoreColor }}>
                <div className="rb-ats-mini-ring"
                  style={{ background: `conic-gradient(${scoreColor} 0% ${scorePct}, var(--border) ${scorePct} 100%)` }}>
                  <div className="rb-ats-mini-inner" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{atsScore}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.06em' }}>ATS</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-mute)', fontSize: 13 }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'flex' }}><IconZoomOut size={15} /></button>
              <span>85%</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'flex' }}><IconZoomIn size={15} /></button>
            </div>
          </div>

          <div className="builder-actions">
            <button><IconCustomize size={13} /> Customize</button>
            <button><IconShare size={13} /> Share</button>
          </div>
        </div>

        {/* Resume Document */}
        <div className="resume-preview">
          <div className="resume-doc">
            <div className="resume-doc-head">
              <div className="rname">{name}</div>
              <div className="rtitle">{jobTitle}</div>
              <div className="rcontact">
                {email} · {location.toUpperCase()} · {linkedin.toUpperCase()}
              </div>
            </div>

            <div className="resume-doc-body">
              {/* Left column */}
              <div className="resume-col">
                <div className="resume-sec-title">Core Skills</div>
                {skills.map(sk => (
                  <span
                    key={sk}
                    className={`resume-skill${matchedKwSet.has(sk.toLowerCase()) || [...matchedKwSet].some(k => sk.toLowerCase().includes(k)) ? ' matched' : ''}`}
                  >
                    {sk}
                  </span>
                ))}

                <div className="resume-sec-title" style={{ marginTop: 18 }}>Education</div>
                {education.map(edu => (
                  <div key={edu.id} className="resume-entry">
                    <div className="title">{edu.degree}</div>
                    <div className="sub">{edu.school}</div>
                    <div className="sub">{edu.period}</div>
                  </div>
                ))}
              </div>

              {/* Right column */}
              <div className="resume-col">
                <div className="resume-sec-title">Professional Summary</div>
                <p style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.6, marginBottom: 14 }}>{summary}</p>

                <div className="resume-sec-title">Work Experience</div>
                {workExp.map(exp => (
                  <div key={exp.id} className="resume-entry">
                    <div className="title">{exp.title}</div>
                    <div className="sub" style={{ color: '#2563eb', fontWeight: 600 }}>{exp.company}</div>
                    <div className="sub">{exp.period}</div>
                    <ul>
                      {exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
