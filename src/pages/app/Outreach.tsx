import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGmail, type HRThread, type GmailMessage, type SendParams } from '../../context/GmailContext'

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_META = {
  'no-reply': { label: 'Awaiting Reply', bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  'replied':  { label: 'Replied',        bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
  'interview':{ label: 'Interview',      bg: '#F0FDF4', color: '#16A34A', dot: '#22C55E' },
  'offer':    { label: 'Offer',          bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B' },
  'rejected': { label: 'Rejected',       bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
} as const

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60)    return `${mins}m ago`
    if (mins < 1440)  return `${Math.floor(mins / 60)}h ago`
    if (mins < 10080) return `${Math.floor(mins / 1440)}d ago`
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

// ── AI Email Generator ─────────────────────────────────────────────────────────
const TECH_SKILLS = [
  'React','Vue','Angular','Node.js','Python','TypeScript','JavaScript','Java','Go','Rust','C++',
  'AWS','GCP','Azure','Docker','Kubernetes','Terraform','CI/CD','SQL','PostgreSQL','MongoDB',
  'Redis','GraphQL','REST','Figma','Product Management','Data Science','Machine Learning',
  'TensorFlow','PyTorch','NLP','LLM','A/B Testing','Analytics','Agile','Scrum','Leadership',
  'PHP','Ruby','Swift','Kotlin','Flutter','React Native','Spark','Airflow','dbt','Tableau',
]

const DOMAIN_KEYWORDS = [
  'fintech','e-commerce','ecommerce','saas','b2b','b2c','edtech','healthtech','logistics',
  'marketplace','platform','infrastructure','developer tools','enterprise','consumer',
]

interface ComposeForm {
  hrName: string
  hrEmail: string
  company: string
  role: string
  jd: string
  tone: 'formal' | 'friendly' | 'bold'
}

interface GeneratedEmail {
  subject: string
  body: string
}

function generateEmail(form: ComposeForm, senderName: string, senderEmail: string, senderRole: string): GeneratedEmail {
  const { hrName, company, role, jd, tone } = form
  const jdLower = jd.toLowerCase()

  const skills = TECH_SKILLS.filter(s => jdLower.includes(s.toLowerCase())).slice(0, 5)
  const expMatch = jd.match(/(\d+)\+?\s*(?:to\s*\d+\s*)?years?/i)
  const expYears = expMatch ? parseInt(expMatch[1]) : null
  const domain = DOMAIN_KEYWORDS.find(d => jdLower.includes(d)) ?? ''

  const greetingFormal = hrName ? `Dear ${hrName}` : 'Dear Hiring Manager'
  const greetingFriendly = hrName ? `Hi ${hrName.split(' ')[0]}` : 'Hi there'
  const skillsStr = skills.length > 0 ? skills.join(', ') : 'the required skills'
  const expStr = expYears ? `${expYears + 1}+ years` : 'several years'
  const domainStr = domain ? ` in the ${domain} space` : ''
  const subject = `${role} – ${senderName} (${expYears ? expYears + '+ yrs' : 'Experienced'} | Open to Immediate Discussion)`

  let body = ''

  if (tone === 'formal') {
    body = `${greetingFormal},

I hope this message finds you well. I am writing to express my strong interest in the ${role} role at ${company}.

With ${expStr} of professional experience${domainStr}, I have developed a solid foundation in ${skillsStr}. My background aligns closely with the requirements outlined in the job description, and I am confident in my ability to contribute meaningfully to ${company}'s objectives.

Throughout my career, I have consistently delivered measurable results in fast-paced, high-growth environments. I am particularly drawn to this opportunity because of ${company}'s strong market position and the scope of impact this role offers.

I have attached my resume for your reference. I would welcome the opportunity to discuss how my experience aligns with your team's needs at your earliest convenience.

Thank you for your time and consideration.

Yours sincerely,
${senderName}
${senderRole}
${senderEmail}`

  } else if (tone === 'bold') {
    body = `${greetingFriendly},

I'll cut straight to it — the ${role} role at ${company} is exactly where I want to be, and I believe I'm exactly who you're looking for.

Here's why:
• ${expStr} of hands-on experience with ${skillsStr}
• Consistent track record of delivering impact in high-stakes, high-scale environments${domainStr}
• I don't just execute — I think strategically about what moves the needle

${company}'s work is exactly the environment where I've consistently performed at my best. I'm not sending a hundred applications — I chose this one specifically because I see the fit.

I'd love a 20-minute call to walk you through specifics. Resume is attached — happy to share anything else you need.

Let's talk.

${senderName}
${senderRole} | ${senderEmail}`

  } else {
    body = `${greetingFriendly},

I came across the ${role} role at ${company} and I'm genuinely excited — it's a strong match with both where I've been and where I want to go next.

A bit about me: I have ${expStr} of experience${domainStr}, with strength in ${skillsStr}. I've spent that time building things that matter to users and driving outcomes that show up in the numbers.

What draws me to ${company} specifically is the kind of scale and ownership this role involves — that's where I thrive. I find the gaps, align the stakeholders, and ship.

I've attached my resume, and I'd love to set up a quick call if you think there's a fit. Happy to work around your schedule.

Looking forward to connecting!

${senderName}
${senderRole} | ${senderEmail}`
  }

  return { subject, body }
}

// ── Thread item (left panel row) ──────────────────────────────────────────────
function ThreadItem({ thread, isActive, onClick }: { thread: HRThread; isActive: boolean; onClick: () => void }) {
  const s = STATUS_META[thread.status]
  const preview = stripHtml(thread.snippet).slice(0, 80)
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '12px 14px',
        background: isActive ? 'var(--blue-50)' : 'var(--bg)',
        border: 'none', borderBottom: '1px solid var(--border)',
        cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
        transition: 'background 0.1s',
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: thread.isRead ? 'transparent' : 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <div style={{ fontWeight: thread.isRead ? 500 : 700, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
            {thread.from || thread.company || thread.fromEmail}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', flexShrink: 0, marginLeft: 8 }}>{formatDate(thread.date)}</div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-soft)', fontWeight: thread.isRead ? 400 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
          {thread.subject}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: s.bg, color: s.color }}>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: s.dot, marginRight: 4, verticalAlign: 'middle' }} />
            {s.label}
          </span>
          {thread.messageCount > 1 && (
            <span style={{ fontSize: 10.5, color: 'var(--text-mute)' }}>{thread.messageCount} msgs</span>
          )}
        </div>
        {preview && (
          <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {preview}
          </div>
        )}
      </div>
    </button>
  )
}

// ── Message bubble (thread detail) ─────────────────────────────────────────────
function MessageBubble({ msg }: { msg: GmailMessage }) {
  const bodyText = stripHtml(msg.body) || msg.snippet
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isFromMe ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: msg.isFromMe ? 'var(--accent)' : '#6B7280', color: '#fff', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          {(msg.from?.[0] ?? '?').toUpperCase()}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{msg.from || (msg.isFromMe ? 'You' : 'HR')}</span>
        <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{formatDate(msg.date)}</span>
      </div>
      <div style={{
        maxWidth: '85%', padding: '10px 14px',
        borderRadius: msg.isFromMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: msg.isFromMe ? 'var(--accent)' : 'var(--bg-soft)',
        color: msg.isFromMe ? '#fff' : 'var(--text)',
        fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
        border: msg.isFromMe ? 'none' : '1px solid var(--border)',
      }}>
        {bodyText || '(no content)'}
      </div>
    </div>
  )
}

// ── Thread detail view ────────────────────────────────────────────────────────
function ThreadDetailView({ thread, onClose, onReply }: {
  thread: HRThread
  onClose: () => void
  onReply: (t: HRThread) => void
}) {
  const { markRead } = useGmail()
  const bodyRef = useRef<HTMLDivElement>(null)
  const s = STATUS_META[thread.status]

  useEffect(() => {
    if (!thread.isRead) markRead(thread.id)
    setTimeout(() => bodyRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 100)
  }, [thread.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4 }}>{thread.subject}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-mute)' }}>{thread.from} · {thread.company}</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color }}>{s.label}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => onReply(thread)} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✨ Reply with AI
          </button>
          <button onClick={onClose} style={{ padding: '7px 10px', borderRadius: 8, background: 'none', color: 'var(--text-mute)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>
      </div>
      <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        {thread.messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
      </div>
    </div>
  )
}

// ── AI Composer ───────────────────────────────────────────────────────────────
function AIComposer({ prefill, replyThread, onSent, onClose }: {
  prefill?: Partial<ComposeForm>
  replyThread?: HRThread
  onSent: () => void
  onClose: () => void
}) {
  const { user } = useAuth()
  const { sendEmail, isConnected } = useGmail()

  const [form, setForm] = useState<ComposeForm>({
    hrName:  prefill?.hrName  ?? replyThread?.from      ?? '',
    hrEmail: prefill?.hrEmail ?? replyThread?.fromEmail  ?? '',
    company: prefill?.company ?? replyThread?.company    ?? '',
    role:    prefill?.role    ?? '',
    jd:      prefill?.jd      ?? '',
    tone:    'friendly',
  })
  const [generated,    setGenerated]    = useState<GeneratedEmail | null>(null)
  const [editedBody,   setEditedBody]   = useState('')
  const [generating,   setGenerating]   = useState(false)
  const [sending,      setSending]      = useState(false)
  const [sent,         setSent]         = useState(false)
  const [error,        setError]        = useState('')
  const [refinePrompt, setRefinePrompt] = useState('')
  const [showRefine,   setShowRefine]   = useState(false)

  const set = (k: keyof ComposeForm, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleGenerate = () => {
    if (!form.company || !form.role) { setError('Please fill in Company and Role.'); return }
    setError('')
    setGenerating(true)
    setTimeout(() => {
      const email = generateEmail(form, user?.name ?? 'Candidate', user?.email ?? '', user?.jobTitle ?? '')
      setGenerated(email)
      setEditedBody(email.body)
      setGenerating(false)
    }, 750)
  }

  const handleRefine = () => {
    if (!refinePrompt.trim()) return
    setGenerating(true)
    setTimeout(() => {
      const p = refinePrompt.toLowerCase()
      let newTone = form.tone
      if (p.includes('formal'))                        newTone = 'formal'
      if (p.includes('bold') || p.includes('confident') || p.includes('aggressive')) newTone = 'bold'
      if (p.includes('friendly') || p.includes('casual')) newTone = 'friendly'
      const regenerated = generateEmail({ ...form, tone: newTone }, user?.name ?? '', user?.email ?? '', user?.jobTitle ?? '')
      let body = regenerated.body
      if ((p.includes('shorter') || p.includes('concise')) && newTone === form.tone) {
        const paragraphs = editedBody.split('\n\n')
        body = paragraphs.filter((_, i) => i !== 2).join('\n\n')
      }
      setEditedBody(body)
      if (newTone !== form.tone) set('tone', newTone)
      setRefinePrompt('')
      setShowRefine(false)
      setGenerating(false)
    }, 600)
  }

  const handleSend = async () => {
    if (!isConnected) { setError('Connect Gmail above to send emails directly.'); return }
    if (!form.hrEmail) { setError('Please enter the HR email address.'); return }
    setSending(true); setError('')
    try {
      const p: SendParams = {
        to:      form.hrEmail,
        subject: generated?.subject ?? `${form.role} Application — ${user?.name}`,
        body:    editedBody || generated?.body || '',
        ...(replyThread ? { threadId: replyThread.id, inReplyTo: replyThread.messages[replyThread.messages.length - 1]?.id } : {}),
      }
      await sendEmail(p)
      setSent(true)
      setTimeout(onSent, 1500)
    } catch (err: any) {
      setError(err.message ?? 'Failed to send. Please try again.')
    } finally { setSending(false) }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  if (sent) return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>Email Sent!</div>
        <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>Your email is on its way to {form.hrEmail}</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          {replyThread ? `Reply to ${replyThread.from || replyThread.company}` : 'AI Email Composer'}
        </div>
        <button onClick={onClose} style={{ padding: '5px 10px', borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--text-mute)', cursor: 'pointer', fontSize: 13 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        {/* Form fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {[
            { label: 'HR NAME', key: 'hrName', placeholder: 'Ravi Mehta' },
            { label: 'HR EMAIL *', key: 'hrEmail', placeholder: 'ravi@company.com' },
            { label: 'COMPANY *', key: 'company', placeholder: 'Google India' },
            { label: 'ROLE *', key: 'role', placeholder: 'Senior Product Manager' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }}>{label}</div>
              <input style={inp} placeholder={placeholder} value={(form as any)[key]} onChange={e => set(key as keyof ComposeForm, e.target.value)} />
            </div>
          ))}
        </div>

        {/* JD */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 4, letterSpacing: '0.06em' }}>
            JOB DESCRIPTION <span style={{ fontWeight: 400 }}>(paste for smarter personalization)</span>
          </div>
          <textarea
            style={{ ...inp, resize: 'vertical', minHeight: 90, lineHeight: 1.5 }}
            placeholder="Paste the job description here. AI will extract required skills, years of experience, and domain context to personalize your email..."
            value={form.jd}
            onChange={e => set('jd', e.target.value)}
          />
        </div>

        {/* Tone selector */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 6, letterSpacing: '0.06em' }}>EMAIL TONE</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['formal', 'friendly', 'bold'] as const).map(t => (
              <button key={t} onClick={() => set('tone', t)} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${form.tone === t ? 'var(--accent)' : 'var(--border)'}`, background: form.tone === t ? 'var(--blue-50)' : 'var(--bg-soft)', color: form.tone === t ? 'var(--accent)' : 'var(--text-mute)', fontWeight: form.tone === t ? 700 : 500, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t === 'formal' ? '🎩 Formal' : t === 'friendly' ? '👋 Friendly' : '⚡ Bold'}
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: '#DC2626', marginBottom: 12 }}>{error}</div>}

        {/* Generate */}
        <button onClick={handleGenerate} disabled={generating || !form.company || !form.role} style={{ width: '100%', padding: 10, borderRadius: 9, border: 'none', background: generating ? 'var(--border)' : 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {generating ? '⏳ Generating…' : '✨ Generate Email with AI'}
        </button>

        {/* Generated email preview */}
        {generated && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
            {/* Subject */}
            <div style={{ background: 'var(--bg-soft)', padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-mute)', marginBottom: 2 }}>SUBJECT LINE</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{generated.subject}</div>
              </div>
              <button onClick={() => navigator.clipboard.writeText(generated.subject)} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Copy</button>
            </div>
            {/* Body */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-mute)' }}>EMAIL BODY <span style={{ fontWeight: 400 }}>(editable)</span></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigator.clipboard.writeText(editedBody)} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Copy</button>
                  <button onClick={() => setShowRefine(v => !v)} style={{ fontSize: 11.5, color: 'var(--text-mute)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Refine</button>
                </div>
              </div>
              <textarea style={{ ...inp, minHeight: 220, resize: 'vertical', lineHeight: 1.65 }} value={editedBody} onChange={e => setEditedBody(e.target.value)} />
            </div>

            {/* Refine panel */}
            {showRefine && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: 'var(--bg-soft)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 6 }}>Tell AI how to improve this email:</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} placeholder='"make it shorter", "more formal", "bold and confident"' value={refinePrompt} onChange={e => setRefinePrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRefine()} />
                  <button onClick={handleRefine} disabled={generating || !refinePrompt.trim()} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Apply</button>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {['Make it shorter', 'More formal', 'Bold & confident', 'Add more energy', 'Friendlier tone'].map(s => (
                    <button key={s} onClick={() => setRefinePrompt(s)} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 12, border: '1px solid var(--border)', background: 'none', color: 'var(--text-mute)', cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send / Copy footer */}
      {generated && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
          {isConnected ? (
            <button onClick={handleSend} disabled={sending} style={{ flex: 1, padding: 10, borderRadius: 9, background: sending ? 'var(--border)' : '#10B981', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {sending ? 'Sending…' : '📧 Send via Gmail'}
            </button>
          ) : (
            <div style={{ flex: 1, fontSize: 12.5, color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px' }}>
              🔗 Connect Gmail above to send directly
            </div>
          )}
          <button onClick={() => navigator.clipboard.writeText(`Subject: ${generated.subject}\n\n${editedBody}`)} style={{ padding: '10px 16px', borderRadius: 9, background: 'none', border: '1px solid var(--border)', color: 'var(--text-mute)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            📋 Copy All
          </button>
        </div>
      )}
    </div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ threads }: { threads: HRThread[] }) {
  const counts = threads.reduce((a, t) => { a[t.status] = (a[t.status] ?? 0) + 1; return a }, {} as Record<string, number>)
  const items = [
    { label: 'Tracked',    value: threads.length,           color: 'var(--accent)' },
    { label: 'Awaiting',   value: counts['no-reply'] ?? 0,  color: '#6B7280' },
    { label: 'Replied',    value: counts['replied'] ?? 0,   color: '#3B82F6' },
    { label: 'Interview',  value: counts['interview'] ?? 0, color: '#22C55E' },
    { label: 'Offer',      value: counts['offer'] ?? 0,     color: '#F59E0B' },
  ]
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      {items.map((item, i) => (
        <div key={i} style={{ flex: 1, padding: '10px 6px', textAlign: 'center', borderRight: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
          <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2, fontWeight: 500 }}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Connect screen ────────────────────────────────────────────────────────────
function ConnectScreen({ connect, connecting, hasClientId }: { connect: () => void; connecting: boolean; hasClientId: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 18 }}>📬</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)', marginBottom: 10 }}>Connect Your Gmail</div>
      <div style={{ fontSize: 14.5, color: 'var(--text-mute)', maxWidth: 420, lineHeight: 1.7, marginBottom: 26 }}>
        JobEarly connects to your Gmail to auto-track HR emails, detect interview and offer status, and let you send AI-written emails directly from here.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 380, width: '100%', marginBottom: 26 }}>
        {[
          { icon: '🔍', title: 'Auto-track HR emails',  desc: 'Detects replies, interviews, and offers' },
          { icon: '✨', title: 'AI-compose emails',      desc: 'Personalized from job descriptions' },
          { icon: '📧', title: 'Send directly',          desc: 'One-click through your Gmail account' },
          { icon: '📊', title: 'Reply rate tracking',    desc: 'See which outreaches get responses' },
        ].map((f, i) => (
          <div key={i} style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', textAlign: 'left' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{f.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-mute)', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
      {!hasClientId && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 16px', fontSize: 12.5, color: '#92400E', marginBottom: 16, maxWidth: 420, textAlign: 'left' }}>
          <strong>Setup required:</strong> Add <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 4 }}>VITE_GOOGLE_CLIENT_ID</code> to your <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 4 }}>.env</code> file. See <code>.env.example</code> for instructions.
        </div>
      )}
      <button onClick={connect} disabled={connecting} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 28px', borderRadius: 10, background: connecting ? 'var(--border)' : '#4285F4', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: connecting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(66,133,244,0.3)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {connecting ? 'Connecting…' : 'Connect with Google'}
      </button>
      <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 10 }}>
        We only request read/send permissions. Your email content is never stored.
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
type Panel =
  | { type: 'none' }
  | { type: 'thread'; thread: HRThread }
  | { type: 'compose'; prefill?: Partial<ComposeForm>; replyThread?: HRThread }

export default function Outreach() {
  const { isConnected, userEmail, connecting, syncing, syncedAt, threads, hasClientId, connect, disconnect, syncThreads } = useGmail()
  const [panel,        setPanel]        = useState<Panel>({ type: 'none' })
  const [statusFilter, setStatusFilter] = useState('all')
  const [search,       setSearch]       = useState('')

  const filtered = threads.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    const q = search.toLowerCase()
    if (q && !t.from.toLowerCase().includes(q) && !t.company.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Page header */}
      <div className="jm-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1>Outreach <em>Command Center</em></h1>
            <p>Track every HR email thread, see reply status automatically, and send AI-personalized emails directly from JobEarly.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
            {isConnected && (
              <>
                <button onClick={() => setPanel({ type: 'compose' })} style={{ padding: '8px 16px', borderRadius: 9, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✨ Compose
                </button>
                <button onClick={syncThreads} disabled={syncing} style={{ padding: '8px 14px', borderRadius: 9, background: 'none', border: '1px solid var(--border)', color: 'var(--text-mute)', fontWeight: 600, fontSize: 12.5, cursor: syncing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {syncing ? '⏳ Syncing…' : '🔄 Sync'}
                </button>
              </>
            )}
          </div>
        </div>

        {isConnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12.5, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '3px 10px', color: '#16A34A', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
              Gmail Connected
            </span>
            <span style={{ color: 'var(--text-mute)' }}>{userEmail}</span>
            {syncedAt && <span style={{ color: 'var(--text-mute)' }}>· Synced {formatDate(syncedAt.toISOString())}</span>}
            <button onClick={disconnect} style={{ marginLeft: 'auto', fontSize: 11.5, color: '#DC2626', background: 'none', border: '1px solid #FCA5A5', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Disconnect</button>
          </div>
        )}
      </div>

      {!isConnected ? (
        <ConnectScreen connect={connect} connecting={connecting} hasClientId={hasClientId} />
      ) : (
        <div style={{ flex: 1, display: 'flex', minHeight: 0, borderTop: '1px solid var(--border)' }}>

          {/* ── Left: Thread list ─────────────────── */}
          <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <StatsBar threads={threads} />

            {/* Search + filters */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <input placeholder="Search HR, company, subject…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)', fontSize: 12.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(['all', 'no-reply', 'replied', 'interview', 'offer', 'rejected'] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    fontSize: 11, padding: '3px 9px', borderRadius: 10, fontFamily: 'inherit', cursor: 'pointer',
                    background: statusFilter === s ? 'var(--accent)' : 'var(--bg-soft)',
                    color: statusFilter === s ? '#fff' : 'var(--text-mute)',
                    border: `1px solid ${statusFilter === s ? 'var(--accent)' : 'var(--border)'}`,
                    fontWeight: statusFilter === s ? 700 : 500,
                  }}>
                    {s === 'all' ? 'All' : STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thread list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {syncing && threads.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
                  Scanning your Gmail for HR emails…
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>📭</div>
                  {threads.length === 0
                    ? 'No HR emails found yet.\nCompose your first outreach!'
                    : 'No threads match this filter.'}
                </div>
              ) : (
                filtered.map(t => (
                  <ThreadItem
                    key={t.id}
                    thread={t}
                    isActive={panel.type === 'thread' && panel.thread.id === t.id}
                    onClick={() => setPanel({ type: 'thread', thread: t })}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Right: Detail / Composer ──────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
            {panel.type === 'none' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)', gap: 12, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 44 }}>✉️</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Select a thread or compose a new email</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: 360 }}>
                  Click an HR thread on the left to view the full conversation, or start a new personalized email with AI.
                </div>
                <button onClick={() => setPanel({ type: 'compose' })} style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✨ Compose New Email
                </button>
              </div>
            )}
            {panel.type === 'thread' && (
              <ThreadDetailView
                key={panel.thread.id}
                thread={panel.thread}
                onClose={() => setPanel({ type: 'none' })}
                onReply={t => setPanel({ type: 'compose', replyThread: t })}
              />
            )}
            {panel.type === 'compose' && (
              <AIComposer
                prefill={panel.prefill}
                replyThread={panel.replyThread}
                onSent={() => { setPanel({ type: 'none' }); syncThreads() }}
                onClose={() => setPanel({ type: 'none' })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
