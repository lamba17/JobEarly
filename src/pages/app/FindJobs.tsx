import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { useJobProfile, type JobProfile } from '../../hooks/useJobProfile'
import { useJobApplications } from '../../hooks/useJobApplications'
import { quickScore, scoreColor, type QuickScore } from '../../lib/jobScore'
import { extractTextFromFile } from '../../lib/resumeFile'
import { COUNTRIES, daysAgo, guessCountry, jobFit, searchJobs, type JobFit, type JobListing } from '../../lib/jobsApi'

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg-soft)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }
const chip = (bg: string, fg: string): React.CSSProperties => ({
  display: 'inline-block', fontSize: 11.5, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: bg, color: fg,
})

function ScoreBadge({ q, hasResume }: { q: QuickScore; hasResume: boolean }) {
  if (!hasResume) return <div style={{ ...chip('var(--bg-soft)', 'var(--text-mute)'), whiteSpace: 'nowrap' }}>Add resume</div>
  const c = scoreColor(q.score)
  return (
    <div title={q.label} style={{ textAlign: 'center', minWidth: 54 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: c, lineHeight: 1 }}>{q.score}%</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: c, letterSpacing: '0.04em', marginTop: 3 }}>{q.label.replace(' match', '').toUpperCase()}</div>
    </div>
  )
}

export default function FindJobs() {
  const { user } = useAuth()
  const { isPro } = useSubscription(user?.id)
  const { profile, loading: profileLoading, save, saveError } = useJobProfile(user?.id)
  const { addJob } = useJobApplications(user?.id)

  const [tab, setTab] = useState<'local' | 'remote'>('local')
  const [q, setQ] = useState('')
  const [city, setCity] = useState('')
  const [company, setCompany] = useState('')
  const [country, setCountry] = useState(guessCountry())
  const [openToMe, setOpenToMe] = useState(true)
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [sort, setSort] = useState<'match' | 'new'>('match')
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState<JobProfile>({ resumeText: '', targetRole: '', city: '', country: '' })
  const [showProfile, setShowProfile] = useState(false)
  const [savedNote, setSavedNote] = useState('')
  const [reading, setReading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const [fits, setFits] = useState<Record<string, JobFit>>({})
  const [fitBusy, setFitBusy] = useState<string | null>(null)
  const [fitError, setFitError] = useState('')
  const [fitErrorId, setFitErrorId] = useState<string | null>(null)
  const [tracked, setTracked] = useState<Set<string>>(new Set())

  // Fill the form from the saved profile once it arrives; open the profile card when there is no resume yet.
  const seeded = useRef(false)
  useEffect(() => {
    if (profileLoading || seeded.current) return
    seeded.current = true
    setDraft(profile)
    setQ(profile.targetRole || user?.jobTitle || '')
    setCity(profile.city)
    if (profile.country) setCountry(profile.country)
    if (profile.resumeText.trim().length < 80) setShowProfile(true)
  }, [profileLoading, profile, user?.jobTitle])

  const hasResume = profile.resumeText.trim().length >= 80

  async function run(nextPage = 1) {
    setError('')
    if (tab === 'local' && !city.trim() && !company.trim()) { setError('Enter a city or a company to search.'); return }
    setLoading(true)
    try {
      const r = await searchJobs({ mode: tab, q: q.trim(), company: company.trim(), where: city.trim(), country: tab === 'remote' && !openToMe ? '' : country, page: nextPage })
      setJobs(prev => (nextPage === 1 ? r.jobs : [...prev, ...r.jobs]))
      setTotal(r.total)
      setPage(nextPage)
      setSearched(true)
      setOpenId(null)
    } catch (e: any) {
      setError(e.message || 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Remote jobs need no city, so show them as soon as the tab opens.
  useEffect(() => {
    if (tab === 'remote' && !profileLoading) { setJobs([]); setSearched(false); run(1) }
    if (tab === 'local') { setJobs([]); setSearched(false); setError('') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, profileLoading])

  const scored = useMemo(() => jobs.map(j => ({ job: j, q: quickScore(profile.resumeText, j) })), [jobs, profile.resumeText])
  const shown = useMemo(() => {
    const list = [...scored]
    if (sort === 'match' && hasResume) list.sort((a, b) => b.q.score - a.q.score)
    else list.sort((a, b) => +new Date(b.job.postedAt) - +new Date(a.job.postedAt))
    return list
  }, [scored, sort, hasResume])

  // Read the uploaded resume in the browser, save the text to the profile, and re-score every job at once.
  async function uploadResume(file: File) {
    setUploadError('')
    setReading(true)
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('That file is over 8 MB. Please upload a smaller resume.')
      const { text } = await extractTextFromFile(file)
      const clean = text.replace(/\u0000/g, '').trim()
      if (clean.length < 80) throw new Error('Could not read enough text from this file. If it is a scanned image, upload a text-based PDF or a DOCX.')
      const next = { ...draft, resumeText: clean, country }
      if (!(await save(next))) throw new Error('Could not save your resume. Please try again.')
      setDraft(next)
      setFileName(file.name)
      setSavedNote('Resume read. Your matches are updated.')
      setTimeout(() => setSavedNote(''), 4000)
    } catch (e: any) {
      setUploadError(e.message || 'Could not read that file.')
    } finally {
      setReading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function removeResume() {
    const next = { ...draft, resumeText: '', country }
    if (await save(next)) { setDraft(next); setFileName('') }
  }

  async function saveProfile() {
    const next = { ...draft, country }
    const ok = await save(next)
    if (ok) {
      setSavedNote('Saved. Your matches are updated.')
      setTimeout(() => setSavedNote(''), 3000)
      if (next.resumeText.trim().length >= 80) setShowProfile(false)
      if (!q && next.targetRole) setQ(next.targetRole)
      if (!city && next.city) setCity(next.city)
    }
  }

  async function runFit(job: JobListing) {
    setFitError('')
    setFitErrorId(job.id)
    setFitBusy(job.id)
    try {
      const r = await jobFit(profile.resumeText, job)
      setFits(f => ({ ...f, [job.id]: r }))
    } catch (e: any) {
      setFits(f => { const { [job.id]: _drop, ...rest } = f; return rest })
      setFitError(e.message || 'Could not score this job.')
    } finally {
      setFitBusy(null)
    }
  }

  async function saveToTracker(job: JobListing) {
    await addJob({
      company: job.company, role: job.title, location: job.location, portal: 'other',
      dateApplied: '', status: 'wishlist', salary: job.salary, notes: job.url, followUpDate: '',
    })
    setTracked(s => new Set(s).add(job.id))
  }

  const verdictStyle = (v: JobFit['verdict']) =>
    v === 'apply' ? chip('#ECFDF5', '#047857') : v === 'stretch' ? chip('#FFFBEB', '#B45309') : chip('#F3F4F6', '#4B5563')
  const verdictText = { apply: 'Apply', stretch: 'Worth a stretch', skip: 'Probably skip' }

  function renderActions(job: JobListing, open: boolean) {
    const fit = fits[job.id]
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '0 16px 14px' }}>
        <button type="button" className="btn-jc-secondary" onClick={() => setOpenId(open ? null : job.id)}>
          {open ? 'Hide description' : 'Job description'}
        </button>
        <a className="btn-jc-primary" href={job.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Apply now ↗</a>
        {isPro ? (
          <>
            <button type="button" className="btn-jc-secondary" disabled={!hasResume || fitBusy === job.id} onClick={() => runFit(job)}
              title={hasResume ? '' : 'Upload your resume to enable this'}>
              {fitBusy === job.id ? 'Scoring…' : fit ? 'Re-score' : 'Detailed fit check'}
            </button>
            <button type="button" className="btn-jc-secondary" disabled={tracked.has(job.id)} onClick={() => saveToTracker(job)}>
              {tracked.has(job.id) ? 'Saved to tracker ✓' : 'Save to tracker'}
            </button>
          </>
        ) : (
          <Link to="/app/settings" className="btn-jc-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Detailed fit check &amp; tracker: Pro
          </Link>
        )}
      </div>
    )
  }

  function renderFit(job: JobListing) {
    const fit = fits[job.id]
    if (!fit) return null
    return (
      <div style={{ margin: '0 16px 14px', background: 'var(--bg-soft)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(fit.score) }}>{fit.score}%</span>
          <span style={verdictStyle(fit.verdict)}>{verdictText[fit.verdict]}</span>
        </div>
        <div style={{ fontSize: 13 }}>{fit.summary}</div>
        {fit.strengths.length > 0 && <div style={{ fontSize: 12.5 }}><b>Strengths:</b> {fit.strengths.join(' · ')}</div>}
        {fit.gaps.length > 0 && <div style={{ fontSize: 12.5 }}><b>Gaps:</b> {fit.gaps.join(' · ')}</div>}
        {fit.tip && <div style={{ fontSize: 12.5 }}><b>Before you apply:</b> {fit.tip}</div>}
      </div>
    )
  }

  function renderDescription(job: JobListing, sc: QuickScore) {
    const text = job.description.replace(/^#{1,6}\s*/gm, '')
    return (
      <div style={{ borderTop: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {hasResume && (
          <div>
            <div style={lbl}>QUICK MATCH · {sc.label.toUpperCase()}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sc.matched.map(t => <span key={t} style={chip('#ECFDF5', '#047857')}>✓ {t}</span>)}
              {sc.missing.map(t => <span key={t} style={chip('#FEF2F2', '#B91C1C')}>+ {t}</span>)}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 6 }}>Green words are already on your resume. Red ones appear in the job but not in your resume.</div>
          </div>
        )}
        <div>
          <div style={lbl}>JOB DESCRIPTION</div>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-soft)', whiteSpace: 'pre-line', maxHeight: 360, overflowY: 'auto' }}>
            {text.slice(0, 8000)}{text.length > 8000 ? '…' : ''}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
          Listing from <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{job.source}</a>. JobEarly does not post or verify these jobs.
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="jm-header">
        <h1>Find <em>Jobs</em></h1>
        <p>Search real openings near you or fully remote, each scored against your resume so you know where to apply first.</p>
      </div>

      {/* ── Profile ───────────────────────────── */}
      <div className="perf-card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div className="perf-card-title" style={{ marginBottom: 2 }}>Your match profile</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
              {hasResume ? 'Resume saved. Scores below compare each job to it.' : 'Upload your resume once to see how well you match every job.'}
            </div>
          </div>
          <button type="button" className="btn-jc-secondary" onClick={() => setShowProfile(s => !s)}>{showProfile ? 'Hide' : hasResume ? 'Edit' : 'Upload resume'}</button>
        </div>
        {showProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <div>
                <div style={lbl}>TARGET ROLE</div>
                <input style={inp} placeholder="Product Designer" value={draft.targetRole} onChange={e => setDraft({ ...draft, targetRole: e.target.value })} />
              </div>
              <div>
                <div style={lbl}>CITY</div>
                <input style={inp} placeholder="Bengaluru" value={draft.city} onChange={e => setDraft({ ...draft, city: e.target.value })} />
              </div>
            </div>
            <div>
              <div style={lbl}>YOUR RESUME</div>
              <input ref={fileInput} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) void uploadResume(f) }} />
              {hasResume ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-soft)' }}>
                  <span style={{ color: '#047857', fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 13, flex: 1, minWidth: 160 }}>
                    {fileName || 'Resume on file'} · {profile.resumeText.trim().split(/\s+/).length} words read
                  </span>
                  <button type="button" className="btn-jc-secondary" disabled={reading} onClick={() => fileInput.current?.click()}>{reading ? 'Reading…' : 'Replace'}</button>
                  <button type="button" className="btn-jc-secondary" disabled={reading} onClick={removeResume}>Remove</button>
                </div>
              ) : (
                <button type="button" disabled={reading}
                  onClick={() => fileInput.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void uploadResume(f) }}
                  style={{ all: 'unset', boxSizing: 'border-box', width: '100%', textAlign: 'center', padding: '26px 14px', border: '2px dashed var(--border)', borderRadius: 10, cursor: 'pointer', background: 'var(--bg-soft)' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{reading ? 'Reading your resume…' : 'Upload your resume'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 4 }}>PDF, DOCX or TXT. Click to choose a file or drop it here.</div>
                </button>
              )}
              {uploadError && <div style={{ fontSize: 12.5, color: '#B91C1C', marginTop: 6 }}>{uploadError}</div>}
              <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 4 }}>Read in your browser and stored privately in your account. Only you can read it. A resume you upload in the Resume Builder is used here automatically.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" className="btn-jc-primary" onClick={saveProfile}>Save role &amp; city</button>
              {savedNote && <span style={{ fontSize: 12.5, color: '#047857' }}>{savedNote}</span>}
              {saveError && <span style={{ fontSize: 12.5, color: '#B91C1C' }}>{saveError}</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── Search ────────────────────────────── */}
      <div className="perf-card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {([['local', 'Near me'], ['remote', 'Remote']] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={tab === k ? 'btn-jc-primary' : 'btn-jc-secondary'} style={{ height: 34, padding: '0 18px' }}>{label}</button>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); run(1) }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, alignItems: 'end' }}>
          <div>
            <div style={lbl}>JOB TITLE OR SKILL</div>
            <input style={inp} placeholder="e.g. React developer" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div>
            <div style={lbl}>COMPANY <span style={{ fontWeight: 400 }}>(optional)</span></div>
            <input style={inp} placeholder="e.g. Deloitte" value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          {tab === 'local' && (
            <div>
              <div style={lbl}>CITY</div>
              <input style={inp} placeholder="e.g. Pune" value={city} onChange={e => setCity(e.target.value)} />
            </div>
          )}
          <div>
            <div style={lbl}>COUNTRY</div>
            <select style={inp} value={country} onChange={e => setCountry(e.target.value)}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-jc-primary" style={{ height: 36 }} disabled={loading}>{loading ? 'Searching…' : 'Search jobs'}</button>
        </form>
        {tab === 'remote' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-soft)', marginTop: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={openToMe} onChange={e => setOpenToMe(e.target.checked)} />
            Only jobs I am allowed to apply for from {COUNTRIES.find(c => c.code === country)?.name ?? 'my country'} (hides "USA only" style roles)
          </label>
        )}
        {error && <div style={{ marginTop: 10, fontSize: 13, color: '#B91C1C' }}>{error}</div>}
      </div>

      {/* ── Results ───────────────────────────── */}
      {searched && !loading && !error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 2px 10px', fontSize: 12.5, color: 'var(--text-soft)' }}>
          <span>{total !== null ? `${total} remote job${total === 1 ? '' : 's'} found` : `${jobs.length} job${jobs.length === 1 ? '' : 's'} shown`}</span>
          <span>Sort by{' '}
            <select value={sort} onChange={e => setSort(e.target.value as 'match' | 'new')} style={{ ...inp, width: 'auto', padding: '4px 8px' }}>
              <option value="match" disabled={!hasResume}>Best match</option>
              <option value="new">Newest</option>
            </select>
          </span>
        </div>
      )}

      {searched && !loading && !error && jobs.length === 0 && (
        <div className="perf-card" style={{ textAlign: 'center', color: 'var(--text-soft)', fontSize: 13.5 }}>
          No jobs found. Try a broader title, a nearby city{tab === 'remote' ? ', or untick the country filter' : ''}.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map(({ job, q: sc }) => {
          const open = openId === job.id
          return (
            <div key={job.id} className="perf-card" style={{ padding: 0, overflow: 'hidden', flexShrink: 0 }}>
              <button type="button" onClick={() => setOpenId(open ? null : job.id)}
                style={{ all: 'unset', boxSizing: 'border-box', display: 'flex', gap: 14, alignItems: 'center', width: '100%', padding: 16, cursor: 'pointer' }}>
                <ScoreBadge q={sc} hasResume={hasResume} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{job.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-soft)', marginTop: 2 }}>{job.company} · {job.location}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {job.remote && <span style={chip('#EFF6FF', '#1D4ED8')}>Remote</span>}
                    {job.eligibility && job.eligibility.toLowerCase() !== 'worldwide' && <span style={chip('var(--bg-soft)', 'var(--text-soft)')}>Open to: {job.eligibility}</span>}
                    {job.type && <span style={chip('var(--bg-soft)', 'var(--text-soft)')}>{job.type}</span>}
                    {job.salary && <span style={chip('#ECFDF5', '#047857')}>{job.salary}</span>}
                    {job.postedAt && <span style={chip('var(--bg-soft)', 'var(--text-mute)')}>{daysAgo(job.postedAt)}</span>}
                  </div>
                </div>
              </button>
              {renderActions(job, open)}
              {renderFit(job)}
              {fitError && fitErrorId === job.id && <div style={{ margin: '0 16px 14px', fontSize: 12.5, color: '#B91C1C' }}>{fitError}</div>}
              {open && renderDescription(job, sc)}
            </div>
          )
        })}
      </div>
      {tab === 'local' && searched && jobs.length >= 10 && (
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button type="button" className="btn-jc-secondary" disabled={loading} onClick={() => run(page + 1)}>{loading ? 'Loading…' : 'Load more'}</button>
        </div>
      )}
      {tab === 'remote' && total !== null && jobs.length < total && (
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button type="button" className="btn-jc-secondary" disabled={loading} onClick={() => run(page + 1)}>{loading ? 'Loading…' : 'Load more'}</button>
        </div>
      )}
    </>
  )
}
