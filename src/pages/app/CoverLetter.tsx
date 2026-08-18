import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { loadCoverLetters, saveCoverLetters, type CoverLetter, type Tone } from '../../lib/coverLetters'
import { IconSparkle, IconDownload } from '../../icons'

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

interface Form {
  fullName: string
  currentRole: string
  company: string
  targetRole: string
  jobDescription: string
  experience: string
  tone: Tone
}

const TONES: { value: Tone; label: string }[] = [
  { value: 'formal',   label: '🎩 Formal' },
  { value: 'friendly', label: '👋 Friendly' },
  { value: 'bold',     label: '⚡ Bold' },
]

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg-soft)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function CoverLetterPage() {
  const { user } = useAuth()

  const [form, setForm] = useState<Form>({
    fullName: user?.name ?? '',
    currentRole: user?.jobTitle ?? '',
    company: '',
    targetRole: '',
    jobDescription: '',
    experience: '',
    tone: 'formal',
  })
  const [letter, setLetter] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [refinePrompt, setRefinePrompt] = useState('')
  const [showRefine, setShowRefine] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [library, setLibrary] = useState<CoverLetter[]>(() => loadCoverLetters(user?.email))

  useEffect(() => { setLibrary(loadCoverLetters(user?.email)) }, [user?.email])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function callGenerate(body: Record<string, unknown>): Promise<string> {
    const res = await fetch('/api/generate-cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to generate cover letter')
    return data.letter as string
  }

  const handleGenerate = async () => {
    if (!form.fullName.trim() || !form.company.trim() || !form.targetRole.trim()) {
      setError('Please fill in Full Name, Company, and Target Role.')
      return
    }
    setError(''); setGenerating(true); setSaved(false)
    try {
      const result = await callGenerate({
        fullName: form.fullName, currentRole: form.currentRole, company: form.company,
        targetRole: form.targetRole, jobDescription: form.jobDescription,
        experience: form.experience, tone: form.tone,
      })
      setLetter(result)
      setActiveId(null)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRefine = async () => {
    if (!refinePrompt.trim() || !letter) return
    setGenerating(true); setError('')
    try {
      const result = await callGenerate({
        fullName: form.fullName, company: form.company, targetRole: form.targetRole,
        previousLetter: letter, refineInstruction: refinePrompt,
      })
      setLetter(result)
      setRefinePrompt('')
      setShowRefine(false)
    } catch (err: any) {
      setError(err.message ?? 'Refine failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveToLibrary = () => {
    if (!letter) return
    const entry: CoverLetter = {
      id: activeId ?? uid(),
      company: form.company, role: form.targetRole, letter, tone: form.tone,
      createdAt: activeId ? (library.find(l => l.id === activeId)?.createdAt ?? Date.now()) : Date.now(),
    }
    const updated = activeId ? library.map(l => l.id === activeId ? entry : l) : [entry, ...library]
    setLibrary(updated)
    saveCoverLetters(user?.email, updated)
    setActiveId(entry.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLoadSaved = (l: CoverLetter) => {
    setForm(f => ({ ...f, company: l.company, targetRole: l.role, tone: l.tone }))
    setLetter(l.letter)
    setActiveId(l.id)
    setError(''); setShowRefine(false)
  }

  const handleDeleteSaved = (id: string) => {
    const updated = library.filter(l => l.id !== id)
    setLibrary(updated)
    saveCoverLetters(user?.email, updated)
    if (activeId === id) { setActiveId(null); setLetter('') }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    const filename = `Cover Letter - ${form.targetRole || 'Role'}${form.company ? ' - ' + form.company : ''}.txt`
    downloadTextFile(filename, letter)
  }

  return (
    <>
      <div className="jm-header">
        <h1>Cover <em>Letter</em> Builder</h1>
        <p>Generate a tailored, AI-written cover letter for any role in seconds — then refine, save, and download it.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, alignItems: 'start' }}>
        {/* ── Left: Form ─────────────────────── */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 12 }}>Your Details</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }}>FULL NAME *</div>
              <input style={inp} placeholder="Priya Sharma" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }}>CURRENT ROLE</div>
              <input style={inp} placeholder="Product Designer" value={form.currentRole} onChange={e => set('currentRole', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }}>COMPANY *</div>
                <input style={inp} placeholder="Google India" value={form.company} onChange={e => set('company', e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }}>TARGET ROLE *</div>
                <input style={inp} placeholder="Senior PM" value={form.targetRole} onChange={e => set('targetRole', e.target.value)} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }}>
                JOB DESCRIPTION <span style={{ fontWeight: 400 }}>(recommended)</span>
              </div>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }} placeholder="Paste the job description for a sharply tailored letter…" value={form.jobDescription} onChange={e => set('jobDescription', e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }}>
                KEY EXPERIENCE / HIGHLIGHTS
              </div>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }} placeholder="Paste your resume summary or a few key achievements to highlight…" value={form.experience} onChange={e => set('experience', e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 6, letterSpacing: '0.06em' }}>TONE</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {TONES.map(t => (
                  <button key={t.value} onClick={() => set('tone', t.value)} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${form.tone === t.value ? 'var(--accent)' : 'var(--border)'}`, background: form.tone === t.value ? 'var(--blue-50)' : 'var(--bg-soft)', color: form.tone === t.value ? 'var(--accent)' : 'var(--text-mute)', fontWeight: form.tone === t.value ? 700 : 500, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: '#DC2626' }}>{error}</div>}

            <button onClick={handleGenerate} disabled={generating} style={{ width: '100%', padding: 10, borderRadius: 9, border: 'none', background: generating ? 'var(--border)' : 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {generating ? '⏳ Generating…' : <><IconSparkle size={14} /> Generate Cover Letter</>}
            </button>
          </div>
        </div>

        {/* ── Right: Output + Library ─────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="perf-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="perf-card-title" style={{ marginBottom: 0 }}>Your Cover Letter</div>
              {letter && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowRefine(v => !v)} style={{ fontSize: 11.5, color: 'var(--text-mute)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Refine</button>
                  <button onClick={handleCopy} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
              )}
            </div>

            {!letter && !generating && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-mute)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>No letter yet</div>
                <div style={{ fontSize: 13, maxWidth: 320, margin: '0 auto', lineHeight: 1.55 }}>
                  Fill in the details on the left and generate a tailored, AI-written cover letter.
                </div>
              </div>
            )}

            {generating && !letter && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-mute)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                Writing your cover letter…
              </div>
            )}

            {letter && (
              <>
                <textarea
                  value={letter}
                  onChange={e => setLetter(e.target.value)}
                  style={{ ...inp, minHeight: 340, resize: 'vertical', lineHeight: 1.7, fontSize: 13.5 }}
                />

                {showRefine && (
                  <div style={{ marginTop: 12, background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 6 }}>Tell AI how to improve this letter:</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input style={{ ...inp, flex: 1 }} placeholder='"make it shorter", "more formal", "add more energy"' value={refinePrompt} onChange={e => setRefinePrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRefine()} />
                      <button onClick={handleRefine} disabled={generating || !refinePrompt.trim()} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Apply</button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {['Make it shorter', 'More formal', 'Bolder & more confident', 'Warmer tone', 'Emphasize leadership'].map(s => (
                        <button key={s} onClick={() => setRefinePrompt(s)} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 12, border: '1px solid var(--border)', background: 'none', color: 'var(--text-mute)', cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button onClick={handleSaveToLibrary} style={{ flex: 1, padding: 10, borderRadius: 9, background: saved ? '#10B981' : 'var(--bg-soft)', border: '1px solid var(--border)', color: saved ? '#fff' : 'var(--text)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {saved ? '✓ Saved' : activeId ? '💾 Update Saved Letter' : '💾 Save to My Letters'}
                  </button>
                  <button onClick={handleDownload} style={{ padding: '10px 16px', borderRadius: 9, background: 'none', border: '1px solid var(--border)', color: 'var(--text-mute)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    <IconDownload size={14} /> Download .txt
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Saved letters library ────────────── */}
          <div className="perf-card">
            <div className="perf-card-title" style={{ marginBottom: 12 }}>My Saved Letters</div>
            {library.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-mute)', textAlign: 'center', padding: '16px 0' }}>
                Saved letters will show up here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {library.map((l, i) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: i < library.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <button onClick={() => handleLoadSaved(l)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: activeId === l.id ? 'var(--accent)' : 'var(--text)' }}>{l.role || 'Untitled Role'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 1 }}>
                        {l.company || 'Unknown Company'} · {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </button>
                    <button onClick={() => handleDeleteSaved(l.id)} title="Delete" style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-soft)', color: '#EF4444', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
