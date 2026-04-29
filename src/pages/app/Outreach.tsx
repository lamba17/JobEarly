import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { IconSearch, IconPlus, IconCheck, IconSparkle } from '../../icons'

// Local icon helpers not in the shared icons file
const IcoWand = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
    <path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/>
    <path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
  </svg>
)
const IcoStar = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IcoCal = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>
  </svg>
)
const IcoArchive = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>
  </svg>
)
const IcoDots = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
)
const IcoAttach = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.93 8.83l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
)
const IcoLink2 = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const IcoChat = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IcoChev = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)

// ── Data ─────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string
  name: string
  status: 'live' | 'draft'
  meta: string
  sent: number
  replied: number
  queued: number
  color: string
}

const CAMPAIGNS: Campaign[] = [
  { id: 'dl', name: 'Design Leadership Q2',  status: 'live',  meta: '24 contacts · 6 templates', sent: 18, replied: 11, queued: 6,  color: 'var(--accent)' },
  { id: 'fa', name: 'FAANG Recruiters',       status: 'live',  meta: '32 contacts · 4 templates', sent: 32, replied: 8,  queued: 0,  color: '#7C3AED' },
  { id: 'fs', name: 'Founders @ Series B',    status: 'live',  meta: '18 contacts · 5 templates', sent: 12, replied: 5,  queued: 6,  color: '#10B981' },
  { id: 'al', name: 'Alumni Warm Intros',     status: 'draft', meta: '14 contacts · 3 templates', sent: 0,  replied: 0,  queued: 14, color: '#94A3B8' },
  { id: 'st', name: 'Stripe Internal Ref',    status: 'live',  meta: '8 contacts · 2 templates',  sent: 6,  replied: 4,  queued: 2,  color: '#F59E0B' },
]

type ConvStatus = 'replied' | 'pending' | 'cold' | 'queued' | 'followup'

interface Convo {
  id: number
  name: string
  co: string
  avClass: string
  initials: string
  preview: string
  time: string
  status: ConvStatus
}

const CONVERSATIONS: Convo[] = [
  { id: 1, name: 'Sara Kim',      co: 'Linear · Head of Design',       avClass: 'av-amber',  initials: 'SK', preview: 'Loved your portfolio — happy to set up a call this week. Are you free Thurs?',           time: '4m',  status: 'replied'  },
  { id: 2, name: 'Marco Reyes',   co: 'Vercel · Eng Manager',           avClass: 'av-violet', initials: 'MR', preview: 'You: Just following up on my note last week about the platform team —',                  time: '1h',  status: 'pending'  },
  { id: 3, name: 'Priya Mehta',   co: 'Stripe · Sr Recruiter',          avClass: 'av-pink',   initials: 'PM', preview: 'Thanks for reaching out! Let me share this with the hiring manager.',                   time: '3h',  status: 'replied'  },
  { id: 4, name: 'Daniel Cheng',  co: 'Notion · VP Product',            avClass: 'av-blue',   initials: 'DC', preview: 'You: Hi Daniel — saw your talk on Notion AI launch and wanted to share —',               time: '1d',  status: 'queued'   },
  { id: 5, name: 'Amélie Laurent', co: 'Figma · Design Lead',           avClass: 'av-green',  initials: 'AL', preview: "You: Following up — I know you're heads-down so no pressure on timing.",                 time: '2d',  status: 'followup' },
  { id: 6, name: 'Jordan Bailey', co: 'Ramp · Recruiting',              avClass: 'av-rose',   initials: 'JB', preview: "Thanks Alex! We're moving forward with another candidate but —",                         time: '3d',  status: 'cold'     },
  { id: 7, name: 'Tomás Aguilar', co: 'Anthropic · Eng Director',       avClass: 'av-amber',  initials: 'TA', preview: 'You: Hi Tomás — your recent paper on constitutional AI got me thinking —',               time: '4d',  status: 'pending'  },
  { id: 8, name: 'Naomi Park',    co: 'Airbnb · UXR Manager',           avClass: 'av-violet', initials: 'NP', preview: 'Happy to chat. My calendar link: cal.com/naomip — pick anything next week.',             time: '5d',  status: 'replied'  },
]

const STATUS_LABEL: Record<ConvStatus, string> = {
  replied: 'REPLIED', pending: 'PENDING', cold: 'COLD', queued: 'QUEUED', followup: 'FOLLOW-UP',
}

type FilterKey = 'all' | ConvStatus

const FILTER_PILLS: [FilterKey, string, number][] = [
  ['all',      'All',            CONVERSATIONS.length],
  ['replied',  'Replied',        3],
  ['pending',  'Awaiting',       2],
  ['queued',   'Queued',         1],
  ['followup', 'Follow-up due',  1],
  ['cold',     'Gone cold',      1],
]

// ── Sub-components ────────────────────────────────────────────────────────────

function CampCard({ c, active, onClick }: { c: Campaign; active: boolean; onClick: () => void }) {
  const total = c.sent + c.queued || 1
  return (
    <div className={`ot-camp${active ? ' active' : ''}`} onClick={onClick}>
      <div className="ot-camp-head">
        <div className="ot-camp-name">{c.name}</div>
        <span className={`ot-camp-status ${c.status}`}>{c.status === 'live' ? 'LIVE' : 'DRAFT'}</span>
      </div>
      <div className="ot-camp-meta">{c.meta}</div>
      <div className="ot-camp-bar">
        <div style={{ width: `${(c.replied / total) * 100}%`, background: c.color }} />
        <div style={{ width: `${((c.sent - c.replied) / total) * 100}%`, background: c.color, opacity: 0.28 }} />
      </div>
      <div className="ot-camp-stats">
        <span><b>{c.replied}</b> replied</span>
        <span><b>{c.sent}</b> sent</span>
        <span><b>{c.queued}</b> queued</span>
      </div>
    </div>
  )
}

function ConvRow({ c, active, onClick }: { c: Convo; active: boolean; onClick: () => void }) {
  return (
    <div className={`ot-conv${active ? ' active' : ''}`} onClick={onClick}>
      <div className={`ot-conv-av ${c.avClass}`}>{c.initials}</div>
      <div className="ot-conv-mid">
        <div className="ot-conv-name">{c.name}</div>
        <div className="ot-conv-co">{c.co}</div>
        <div className="ot-conv-prev">{c.preview}</div>
      </div>
      <div className="ot-conv-right">
        <div className="ot-conv-time">{c.time}</div>
        <span className={`ot-status-pill ${c.status}`}>
          <span className="dot" />
          {STATUS_LABEL[c.status]}
        </span>
      </div>
    </div>
  )
}

function Timeline() {
  const steps = [
    { label: 'Initial',           state: 'done',   n: '1' },
    { label: 'Reply',             state: 'done',   n: '2' },
    { label: 'Drafting follow-up', state: 'now',   n: '3' },
    { label: 'Send Tue 9am',      state: 'future', n: '4' },
    { label: 'Final nudge',       state: 'future', n: '5' },
  ]
  return (
    <div className="ot-timeline">
      <div className="ot-timeline-head">
        <div className="t">SEQUENCE — DESIGN LEADERSHIP Q2</div>
        <a className="e" href="#">Edit sequence →</a>
      </div>
      <div className="ot-tl-track">
        {steps.map((s, i) => (
          <div key={i} className={`ot-tl-step ${s.state}`}>
            <div className="ot-tl-dot">{s.state === 'done' ? <IconCheck size={10} /> : s.n}</div>
            <div className="ot-tl-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailPanel({ convo }: { convo: Convo }) {
  const [tone, setTone] = useState('Warm')
  const [showTones, setShowTones] = useState(false)

  return (
    <div className="ot-col">
      <div className="ot-detail-head">
        <div className={`ot-av-lg ${convo.avClass}`}>{convo.initials}</div>
        <div>
          <div className="ot-nm">{convo.name} · Linear</div>
          <div className="ot-role">Head of Design · San Francisco · 2nd connection</div>
        </div>
        <div className="ot-actions">
          <button className="ot-icon-btn" title="Star"><IcoStar size={13} /></button>
          <button className="ot-icon-btn" title="Calendar"><IcoCal size={13} /></button>
          <button className="ot-icon-btn" title="Archive"><IcoArchive size={13} /></button>
          <button className="ot-icon-btn" title="More"><IcoDots size={13} /></button>
        </div>
      </div>

      <Timeline />

      <div className="ot-thread">
        <div className="ot-msg outbound">
          <div className="ot-msg-head">
            <span className="from">You · alex@jobearly.ai</span>
            <span className="time">Mon · 9:14 AM</span>
          </div>
          <div className="ot-msg-subject">Loved Linear's planning rebuild — a thought on the graph layer</div>
          <div className="ot-msg-body">
            <p>Hi Sara,</p>
            <p>I've been following Linear's shift toward graph-based planning and wanted to share something. At Stripe I shipped the planning layer for our payments migration — same shape of problem, and I learned the hard way which abstractions that actually scale to teams of 200+.</p>
            <p>Would love 20 minutes if you're up for it. I'd come with a Loom walkthrough of the patterns, not a pitch.</p>
          </div>
          <div className="ot-msg-meta">
            <span className="item green"><IconCheck size={10} /> Delivered</span>
            <span className="item green"><IconCheck size={10} /> Opened 3×</span>
            <span className="item">Mon · 9:14 AM</span>
          </div>
        </div>

        <div className="ot-msg inbound">
          <div className="ot-msg-head">
            <span className="from">Sara Kim · sara@linear.app</span>
            <span className="time">Mon · 2:41 PM</span>
          </div>
          <div className="ot-msg-subject">Re: Loved Linear's planning rebuild</div>
          <div className="ot-msg-body">
            <p>Alex — this is a great note. The graph work is exactly where I'm focused this quarter and your Stripe context sounds directly relevant.</p>
            <p>Are you free Thursday afternoon? Happy to do 30 min if you can spare it. Send the Loom either way; the team would benefit.</p>
            <p>— Sara</p>
          </div>
        </div>
      </div>

      <div className="ot-composer">
        <div className="ot-composer-head">
          <div className="ot-composer-left">
            <span className="ot-ai-tag"><IconSparkle size={11} /> AI DRAFTING</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>Replying to Sara · Variant 2 of 3</span>
          </div>
          <div className="ot-composer-controls">
            <button className={`ot-var-btn${showTones ? ' active' : ''}`} onClick={() => setShowTones(v => !v)}>
              Tone <span className="v">{tone}</span> <IcoChev size={10} />
            </button>
            <button className="ot-var-btn">Length <span className="v">Concise</span> <IcoChev size={10} /></button>
            <button className="ot-var-btn">Angle <span className="v">Mutual interest</span> <IcoChev size={10} /></button>
          </div>
        </div>

        {showTones && (
          <div className="ot-var-popover">
            {['Warm', 'Direct', 'Curious', 'Playful', 'Formal'].map(t => (
              <button
                key={t}
                className="ot-var-chip"
                onClick={() => { setTone(t); setShowTones(false) }}
                style={t === tone ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--blue-50)' } : {}}
              >{t}</button>
            ))}
          </div>
        )}

        <div className="ot-composer-draft">
          Hey Sara — <span className="pl">Thursday at 3pm PT</span> works perfectly. Sending a calendar invite now and I'll attach the Loom walkthrough so the team has it ahead of time.
          <br /><br />
          Quick preview: it covers <span className="pl">how we sequenced the migration without freezing the planning layer</span> — three patterns that survived production. Curious which resonate with where Linear's headed.
          <span className="ot-cursor" />
        </div>

        <div className="ot-composer-foot">
          <div className="ot-composer-tools">
            <button className="ot-tool-btn" title="Attach"><IcoAttach size={14} /></button>
            <button className="ot-tool-btn" title="Link"><IcoLink2 size={14} /></button>
            <button className="ot-tool-btn" title="Calendar"><IcoCal size={14} /></button>
            <button className="ot-tool-btn" title="Templates"><IcoChat size={14} /></button>
          </div>
          <div className="ot-send-row">
            <button className="ot-regen-btn"><IcoWand size={12} /> Regenerate</button>
            <button className="ot-send-btn">
              <span style={{ padding: '0 10px' }}>Send &amp; queue follow-up</span>
              <span className="ot-split-arrow"><IcoChev size={10} /></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Outreach() {
  const { user } = useAuth()
  const [activeCamp, setActiveCamp] = useState('dl')
  const [activeConv, setActiveConv] = useState(1)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')

  const filteredConvos = CONVERSATIONS.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.co.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const activeConvoData = CONVERSATIONS.find(c => c.id === activeConv) ?? CONVERSATIONS[0]

  return (
    <>
      {/* Header */}
      <div className="ot-head-row">
        <div>
          <div className="ot-eyebrow"><span className="dot" /> 6 conversations active</div>
          <h1 className="ot-h1">The Inside <span className="ot-serif-accent">Track.</span></h1>
          <p className="ot-lede">
            You've sent <b>68 personalized emails</b> this month and earned <b>32 replies</b> — a reply rate{' '}
            <b>3.2× the industry average</b>.
            {user?.name && ` Keep it up, ${user.name.split(' ')[0]}.`}
          </p>
        </div>
        <div className="ot-perf-tiles">
          <div className="ot-perf-tile"><div className="num">47%</div><div className="lbl">REPLY RATE</div></div>
          <div className="ot-perf-tile"><div className="num">12</div><div className="lbl">MEETINGS BOOKED</div></div>
          <div className="ot-perf-tile"><div className="num">2.4d</div><div className="lbl">AVG. RESPONSE</div></div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="ot-filter-bar">
        <div className="ot-pills">
          {FILTER_PILLS.map(([k, label, n]) => (
            <button key={k} className={`ot-fpill${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>
              {label} <span className="count">{n}</span>
            </button>
          ))}
        </div>
        <div className="ot-search">
          <IconSearch size={14} />
          <input
            placeholder="Search by name, company, role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="ot-kbd">⌘K</span>
        </div>
      </div>

      {/* 3-column workspace */}
      <div className="ot-workspace">
        {/* Campaigns column */}
        <div className="ot-col">
          <div className="ot-col-head">
            <h3>Campaigns</h3>
            <button className="ot-add-btn" title="New campaign"><IconPlus size={13} /></button>
          </div>
          <div className="ot-col-body">
            {CAMPAIGNS.map(c => (
              <CampCard key={c.id} c={c} active={activeCamp === c.id} onClick={() => setActiveCamp(c.id)} />
            ))}
          </div>
        </div>

        {/* Conversations column */}
        <div className="ot-col">
          <div className="ot-col-head">
            <h3>Conversations · Design Leadership Q2</h3>
            <div className="ot-reply-badge">
              <div className="ot-reply-ring"><div className="v">47%</div></div>
              <span className="up">↑ 12%</span>
            </div>
          </div>
          <div className="ot-col-body">
            {filteredConvos.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
                No conversations match this filter.
              </div>
            ) : (
              filteredConvos.map(c => (
                <ConvRow key={c.id} c={c} active={activeConv === c.id} onClick={() => setActiveConv(c.id)} />
              ))
            )}
          </div>
        </div>

        {/* Detail column */}
        <DetailPanel convo={activeConvoData} />
      </div>
    </>
  )
}
