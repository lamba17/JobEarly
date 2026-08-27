import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { loadTickets, saveTickets, CATEGORY_META, STATUS_META, type SupportTicket, type TicketCategory } from '../../lib/supportTickets'
import { IconHelp } from '../../icons'

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

const CATEGORIES = Object.keys(CATEGORY_META) as TicketCategory[]

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg-soft)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

export default function Support() {
  const { user } = useAuth()

  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<TicketCategory>('bug')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [tickets, setTickets] = useState<SupportTicket[]>(() => loadTickets(user?.email))

  const handleSubmit = () => {
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in a subject and description.')
      return
    }
    setError('')
    const ticket: SupportTicket = {
      id: uid(), subject: subject.trim(), category, description: description.trim(),
      status: 'open', createdAt: Date.now(),
    }
    const updated = [ticket, ...tickets]
    setTickets(updated)
    saveTickets(user?.email, updated)
    setSubject(''); setDescription(''); setCategory('bug')
  }

  const handleToggleStatus = (id: string) => {
    const updated = tickets.map(t => t.id === id ? { ...t, status: t.status === 'resolved' ? 'open' as const : 'resolved' as const } : t)
    setTickets(updated)
    saveTickets(user?.email, updated)
  }

  return (
    <>
      <div className="jm-header">
        <h1>Help <em>Center</em></h1>
        <p>Run into a bug or have a question? Submit a ticket and track it here.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Submit a ticket */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 12 }}>Submit a Ticket</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }}>SUBJECT *</div>
              <input style={inp} placeholder="Briefly describe the issue" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 6, letterSpacing: '0.06em' }}>CATEGORY</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${category === c ? 'var(--accent)' : 'var(--border)'}`, background: category === c ? 'var(--blue-50)' : 'var(--bg-soft)', color: category === c ? 'var(--accent)' : 'var(--text-mute)', fontWeight: category === c ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {CATEGORY_META[c].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }}>DESCRIPTION *</div>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 120, lineHeight: 1.5 }} placeholder="What happened? Steps to reproduce, what you expected, screenshots described, etc." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: '#DC2626' }}>{error}</div>}

            <button onClick={handleSubmit} style={{ width: '100%', padding: 10, borderRadius: 9, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Submit Ticket
            </button>
          </div>
        </div>

        {/* My tickets */}
        <div className="perf-card">
          <div className="perf-card-title" style={{ marginBottom: 12 }}>My Tickets {tickets.length > 0 && <span style={{ fontWeight: 400, color: 'var(--text-mute)' }}>({tickets.length})</span>}</div>

          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-mute)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}><IconHelp size={36} /></div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>No tickets yet</div>
              <div style={{ fontSize: 13, maxWidth: 300, margin: '0 auto', lineHeight: 1.55 }}>
                Found a bug or have a question? Submit a ticket on the left and it'll show up here.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tickets.map((t, i) => {
                const sm = STATUS_META[t.status]
                return (
                  <div key={t.id} style={{ padding: '14px 0', borderBottom: i < tickets.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>{t.subject}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>{sm.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: 'var(--bg-soft)', color: 'var(--text-mute)', border: '1px solid var(--border)' }}>
                        {CATEGORY_META[t.category].label}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.55 }}>{t.description}</p>
                    <button onClick={() => handleToggleStatus(t.id)} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {t.status === 'resolved' ? 'Reopen' : 'Mark as Resolved'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
