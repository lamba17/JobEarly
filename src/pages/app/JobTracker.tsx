import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { type Status, type Portal, type JobApplication, STATUS_META, PORTAL_META, ALL_STATUSES, jobTrackerKey } from '../../lib/jobTracker'

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

function daysSince(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff}d ago`
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`
  return `${Math.floor(diff / 365)}y ago`
}

function CompanyInitial({ company, size = 42 }: { company: string; size?: number }) {
  const colors = ['#3B82F6','#8B5CF6','#F59E0B','#10B981','#EF4444','#F97316','#0A66C2','#EC4899']
  const color = colors[(company.charCodeAt(0) || 0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, background: color,
      display: 'grid', placeItems: 'center', flexShrink: 0,
      color: '#fff', fontWeight: 800, fontSize: size * 0.42, letterSpacing: '-0.5px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {company.trim()[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

// ── Empty form ────────────────────────────────────────────────────────────────
const EMPTY_FORM: Omit<JobApplication, 'id' | 'createdAt'> = {
  company: '', role: '', location: '', portal: 'linkedin',
  dateApplied: new Date().toISOString().slice(0, 10),
  status: 'applied', salary: '', notes: '', followUpDate: '',
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function JobTracker() {
  const { user } = useAuth()
  const storageKey = jobTrackerKey(user?.email)

  const [jobs, setJobs] = useState<JobApplication[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]') } catch { return [] }
  })
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status'>('date')
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(jobs))
  }, [jobs, storageKey])

  useEffect(() => {
    if (showModal) setTimeout(() => firstInputRef.current?.focus(), 50)
  }, [showModal])

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, dateApplied: new Date().toISOString().slice(0, 10) })
    setShowModal(true)
  }

  function openEdit(job: JobApplication) {
    setEditingId(job.id)
    setForm({
      company: job.company, role: job.role, location: job.location,
      portal: job.portal, dateApplied: job.dateApplied, status: job.status,
      salary: job.salary, notes: job.notes, followUpDate: job.followUpDate,
    })
    setShowModal(true)
  }

  function saveJob() {
    if (!form.company.trim() || !form.role.trim()) return
    if (editingId) {
      setJobs(prev => prev.map(j => j.id === editingId ? { ...j, ...form } : j))
    } else {
      setJobs(prev => [{ ...form, id: uid(), createdAt: Date.now() }, ...prev])
    }
    setShowModal(false)
  }

  function deleteJob(id: string) {
    setJobs(prev => prev.filter(j => j.id !== id))
    setDeleteId(null)
  }

  function updateStatus(id: string, status: Status) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const filtered = jobs
    .filter(j => statusFilter === 'all' || j.status === statusFilter)
    .filter(j => {
      if (!search) return true
      const q = search.toLowerCase()
      return j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q) || j.location.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'date')    return new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
      if (sortBy === 'company') return a.company.localeCompare(b.company)
      if (sortBy === 'status')  return ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status)
      return 0
    })

  const counts = ALL_STATUSES.reduce((acc, s) => ({ ...acc, [s]: jobs.filter(j => j.status === s).length }), {} as Record<string, number>)
  const activeCount  = jobs.filter(j => ['applied','phone_screen','interview','final_round'].includes(j.status)).length
  const offerCount   = counts['offer'] ?? 0
  const rejectCount  = counts['rejected'] ?? 0
  const responseRate = jobs.length > 0 ? Math.round(((jobs.length - (counts['applied'] ?? 0) - (counts['wishlist'] ?? 0)) / jobs.length) * 100) : 0

  // ── Form helpers ──────────────────────────────────────────────────────────
  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="jm-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Job <em>Tracker</em></h1>
            <p style={{ margin: 0 }}>Track every application you've submitted — across all portals, in one place.</p>
          </div>
          <button
            onClick={openAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 2px 12px rgba(59,130,246,0.28)', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Add Application
          </button>
        </div>

        {/* ── Stats row ──────────────────────────────────────────── */}
        <div className="jm-header-stats" style={{ marginTop: 18 }}>
          <div className="jm-stat-pill"><div className="jm-num">{jobs.length}</div><div className="jm-lbl">TOTAL APPLIED</div></div>
          <div className="jm-stat-pill"><div className="jm-num" style={{ color: '#3B82F6' }}>{activeCount}</div><div className="jm-lbl">IN PROGRESS</div></div>
          <div className="jm-stat-pill"><div className="jm-num" style={{ color: '#F59E0B' }}>{(counts['interview'] ?? 0) + (counts['phone_screen'] ?? 0) + (counts['final_round'] ?? 0)}</div><div className="jm-lbl">INTERVIEWS</div></div>
          <div className="jm-stat-pill"><div className="jm-num" style={{ color: '#10B981' }}>{offerCount}</div><div className="jm-lbl">OFFERS</div></div>
          <div className="jm-stat-pill"><div className="jm-num" style={{ color: rejectCount > 0 ? '#EF4444' : undefined }}>{rejectCount}</div><div className="jm-lbl">REJECTED</div></div>
          <div className="jm-stat-pill"><div className="jm-num">{responseRate}%</div><div className="jm-lbl">RESPONSE RATE</div></div>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        {/* Status pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
          {(['all', ...ALL_STATUSES] as const).map(s => {
            const cnt = s === 'all' ? jobs.length : (counts[s] ?? 0)
            const active = statusFilter === s
            const meta = s !== 'all' ? STATUS_META[s] : null
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
                  borderRadius: 7, border: `1.5px solid ${active && meta ? meta.border : active ? 'var(--border-strong)' : 'var(--border)'}`,
                  background: active && meta ? meta.bg : active ? 'var(--bg-soft)' : 'transparent',
                  color: active && meta ? meta.color : active ? 'var(--text)' : 'var(--text-mute)',
                  fontWeight: active ? 700 : 500, fontSize: 12.5, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.14s',
                }}
              >
                {s === 'all' ? 'All' : meta!.label}
                {cnt > 0 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18,
                    borderRadius: 9, display: 'grid', placeItems: 'center',
                    background: active && meta ? meta.color : 'var(--border)',
                    color: active && meta ? '#fff' : 'var(--text-mute)',
                    padding: '0 4px',
                  }}>{cnt}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search + sort */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="jm-search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Search company or role…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-mute)', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="jm-filter-btn" style={{ cursor: 'pointer', fontFamily: 'inherit', paddingRight: 8 }}>
            <option value="date">Sort: Date</option>
            <option value="company">Sort: Company</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────── */}
      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 24px', color: 'var(--text-mute)' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 8 }}>No applications yet</div>
          <div style={{ fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
            Apply to jobs on LinkedIn, Indeed, Naukri, or any portal — then come back and add them here to track your progress.
          </div>
          <button onClick={openAdd} style={{
            padding: '11px 24px', background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Add Your First Application
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-mute)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          No applications match your filter. <button onClick={() => { setStatusFilter('all'); setSearch('') }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>Clear filters</button>
        </div>
      ) : (
        /* ── Job list ───────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(job => {
            const sm = STATUS_META[job.status]
            const pm = PORTAL_META[job.portal]
            const hasFollowUp = job.followUpDate && new Date(job.followUpDate) >= new Date(new Date().toISOString().slice(0, 10))
            return (
              <div key={job.id} className="job-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
                  <CompanyInitial company={job.company} size={44} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top row: role + status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 3 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)', lineHeight: 1.25 }}>{job.role}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 2 }}>
                          {job.company}
                          {job.location && <> · {job.location}</>}
                        </div>
                      </div>
                      {/* Status selector */}
                      <select
                        value={job.status}
                        onChange={e => updateStatus(job.id, e.target.value as Status)}
                        style={{
                          padding: '4px 10px', borderRadius: 7, border: `1.5px solid ${sm.border}`,
                          background: sm.bg, color: sm.color, fontWeight: 700, fontSize: 11.5,
                          cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                          appearance: 'none', WebkitAppearance: 'none', paddingRight: 20,
                        }}
                      >
                        {ALL_STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_META[s].label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                      {/* Portal badge */}
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: `${pm.color}12`, color: pm.color, border: `1px solid ${pm.color}30` }}>
                        {pm.label}
                      </span>
                      {/* Date */}
                      <span style={{ fontSize: 11.5, color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        Applied {daysSince(job.dateApplied)}
                      </span>
                      {/* Salary */}
                      {job.salary && (
                        <span style={{ fontSize: 11.5, color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9h4.5a1.5 1.5 0 0 1 0 3H9m0 0h4.5a1.5 1.5 0 0 1 0 3H9"/></svg>
                          {job.salary}
                        </span>
                      )}
                      {/* Follow-up */}
                      {hasFollowUp && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#FFF7ED', color: '#F97316', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 3"/></svg>
                          Follow up {new Date(job.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {job.notes && (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.55, borderLeft: '2.5px solid var(--border)', paddingLeft: 10, fontStyle: 'italic' }}>
                        {job.notes.length > 120 ? job.notes.slice(0, 120) + '…' : job.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, marginLeft: 4 }}>
                    <button
                      onClick={() => openEdit(job)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-soft)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-mute)' }}
                      title="Edit"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={() => setDeleteId(job.id)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-soft)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#EF4444' }}
                      title="Delete"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16,
            width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          }}>
            {/* Modal header */}
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
                {editingId ? 'Edit Application' : 'Add Application'}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'grid', placeItems: 'center', width: 28, height: 28 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Form */}
            <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Company + Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={labelStyle}>
                  Company <span style={{ color: '#EF4444' }}>*</span>
                  <input ref={firstInputRef} className="rb-form-input" value={form.company} onChange={setF('company')} placeholder="e.g. Infosys" />
                </label>
                <label style={labelStyle}>
                  Role / Title <span style={{ color: '#EF4444' }}>*</span>
                  <input className="rb-form-input" value={form.role} onChange={setF('role')} placeholder="e.g. Senior Consultant" />
                </label>
              </div>

              {/* Location + Salary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={labelStyle}>
                  Location
                  <input className="rb-form-input" value={form.location} onChange={setF('location')} placeholder="e.g. Bangalore" />
                </label>
                <label style={labelStyle}>
                  Salary / CTC
                  <input className="rb-form-input" value={form.salary} onChange={setF('salary')} placeholder="e.g. ₹25 LPA" />
                </label>
              </div>

              {/* Portal + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={labelStyle}>
                  Applied Via
                  <select className="rb-form-input" value={form.portal} onChange={setF('portal')}>
                    {(Object.keys(PORTAL_META) as Portal[]).map(p => (
                      <option key={p} value={p}>{PORTAL_META[p].label}</option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Status
                  <select className="rb-form-input" value={form.status} onChange={setF('status')}>
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Date Applied + Follow-up */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={labelStyle}>
                  Date Applied
                  <input className="rb-form-input" type="date" value={form.dateApplied} onChange={setF('dateApplied')} />
                </label>
                <label style={labelStyle}>
                  Follow-up Date
                  <input className="rb-form-input" type="date" value={form.followUpDate} onChange={setF('followUpDate')} />
                </label>
              </div>

              {/* Notes */}
              <label style={labelStyle}>
                Notes
                <textarea
                  className="rb-form-input"
                  value={form.notes}
                  onChange={setF('notes')}
                  placeholder="Recruiter name, referral, link, next steps…"
                  rows={3}
                  style={{ resize: 'vertical', minHeight: 72 }}
                />
              </label>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'none', color: 'var(--text-mute)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveJob}
                  disabled={!form.company.trim() || !form.role.trim()}
                  style={{
                    padding: '9px 22px', borderRadius: 9, border: 'none',
                    background: form.company.trim() && form.role.trim() ? 'var(--accent)' : 'var(--border)',
                    color: form.company.trim() && form.role.trim() ? '#fff' : 'var(--text-mute)',
                    fontWeight: 700, fontSize: 13.5, cursor: form.company.trim() && form.role.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {editingId ? 'Save Changes' : 'Add Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 28px', maxWidth: 380, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            <div style={{ fontWeight: 800, fontSize: 15.5, color: 'var(--text)', marginBottom: 8 }}>Remove this application?</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-mute)', marginBottom: 22, lineHeight: 1.55 }}>
              This will permanently delete{' '}
              <b style={{ color: 'var(--text)' }}>{jobs.find(j => j.id === deleteId)?.role ?? 'this application'}</b>{' '}
              at <b style={{ color: 'var(--text)' }}>{jobs.find(j => j.id === deleteId)?.company}</b>.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', color: 'var(--text-mute)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => deleteJob(deleteId)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 5,
  fontSize: 12, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.04em',
  textTransform: 'uppercase',
}
