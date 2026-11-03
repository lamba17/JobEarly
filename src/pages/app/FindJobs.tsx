import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { useJobProfile, type JobProfile } from '../../hooks/useJobProfile'
import { useJobApplications } from '../../hooks/useJobApplications'
import { quickScore, scoreColor, type QuickScore } from '../../lib/jobScore'
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

  const [fits, setFits] = useState<Record<string, JobFit>>({})
  const [fitBusy, setFitBusy] = useState<string | null>(null)
  const [fitError, setFitError] = useState('')
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
    if (tab === 'local' && !city.trim()) { setError('Enter the city you want to work in.'); return }
    setLoading(true)
    try {
      const r = await searchJobs({ mode: tab, q: q.trim(), where: city.trim(), country: tab === 'remote' && !openToMe ? '' : country, page: nextPage })
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
              {hasResume ? 'Resume saved. Scores below compare each job to it.' : 'Paste your resume once to see how well you match every job.'}
            </div>
          </div>
          <button type="button" className="btn-jc-secondary" onClick={() => setShowProfile(s => !s)}>{showProfile ? 'Hide' : hasResume ? 'Edit' : 'Add resume'}</button>
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
              <div style={lbl}>RESUME TEXT</div>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 140, lineHeight: 1.5 }} placeholder="Paste the text of your resume here: experience, skills, tools, education…" value={draft.resumeText} onChange={e => setDraft({ ...draft, resumeText: e.target.value })} />
              <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 4 }}>Stored privately in your account. Only you can read it.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" className="btn-jc-primary" onClick={saveProfile}>Save profile</button>
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
          const fit = fits[job.id]
          return (
            <div key={job.id} className="perf-card" style={{ padding: 0, overflow: 'hidden' }}>
              <button type="button" onClick={() => setOpenId(open ? null : job.id)}
                style={{ all: 'unset', boxSizing: 'border-box', display: 'flex', gap: 14, alignItems: 'center', width: '100%', padding: 16, cursor: 'pointer' }}>
                <ScoreBadge q={sc} hasResume={hasResume} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{job.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-soft)', marginTop: 2 }}>{job.company} · {job.location}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {job.remote && <span style={chip('#EFF6FF', '#1D4ED8')}>Remote</span>}
                    {job.eligibility && job.eligibility.toLowerCase() !== 'worldwide' && <span style={chip('var(--bg-soft)', 'var(--text-soft)')}>{job.eligibility}</span>}
                    {job.type && <span style={chip('var(--bg-soft)', 'var(--text-soft)')}>{job.type}</span>}
                    {job.salary && <span style={chip('#ECFDF5', '#047857')}>{job.salary}</span>}
                    {job.postedAt && <span style={chip('var(--bg-soft)', 'var(--text-mute)')}>{daysAgo(job.postedAt)}</span>}
                  </div>
                </div>
              </button>

              {open && (
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

                  <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-soft)', whiteSpace: 'pre-line', maxHeight: 220, overflowY: 'auto' }}>
                    {job.description.slice(0, 1800)}{job.description.length > 1800 ? '…' : ''}
                  </div>

                  {fit && (
                    <div style={{ background: 'var(--bg-soft)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(fit.score) }}>{fit.score}%</span>
                        <span style={verdictStyle(fit.verdict)}>{verdictText[fit.verdict]}</span>
                      </div>
                      <div style={{ fontSize: 13 }}>{fit.summary}</div>
                      {fit.strengths.length > 0 && <div style={{ fontSize: 12.5 }}><b>Strengths:</b> {fit.strengths.join(' · ')}</div>}
                      {fit.gaps.length > 0 && <div style={{ fontSize: 12.5 }}><b>Gaps:</b> {fit.gaps.join(' · ')}</div>}
                      {fit.tip && <div style={{ fontSize: 12.5 }}><b>Before you apply:</b> {fit.tip}</div>}
                    </div>
                  )}
                  {fitError && openId === job.id && <div style={{ fontSize: 12.5, color: '#B91C1C' }}>{fitError}</div>}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <a className="btn-jc-primary" href={job.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Apply now ↗</a>
                    {isPro ? (
                      <>
                        <button type="button" className="btn-jc-secondary" disabled={!hasResume || fitBusy === job.id} onClick={() => runFit(job)}>
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
                    {!hasResume && <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>Add your resume to enable scoring.</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                    Listing from <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{job.source}</a>. JobEarly does not post or verify these jobs.
                  </div>
                </div>
              )}
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
