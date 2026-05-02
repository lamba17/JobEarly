import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { IconSearch, IconPlus, IconCheck, IconSparkle } from '../../icons'

const IcoWand     = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>
const IcoStar     = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const IcoCal      = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
const IcoArchive  = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
const IcoDots     = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
const IcoAttach   = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.93 8.83l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
const IcoLink2    = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
const IcoChat     = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const IcoChev     = ({ size = 11 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>

// ── Data ──────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string; name: string; status: 'live' | 'draft'
  meta: string; sent: number; replied: number; queued: number; color: string
}

const CAMPAIGNS: Campaign[] = [
  { id: 'cs', name: 'Consulting & Strategy Roles', status: 'live',  meta: '18 contacts · 4 templates', sent: 14, replied: 6, queued: 4,  color: 'var(--accent)' },
  { id: 'it', name: 'India Tech PMs',              status: 'live',  meta: '22 contacts · 5 templates', sent: 18, replied: 5, queued: 4,  color: '#7C3AED'      },
  { id: 'fi', name: 'Fintech & BFSI',              status: 'live',  meta: '16 contacts · 3 templates', sent: 10, replied: 3, queued: 6,  color: '#059669'      },
  { id: 'al', name: 'Alumni Network',              status: 'draft', meta: '12 contacts · 2 templates', sent: 0,  replied: 0, queued: 12, color: '#94A3B8'      },
  { id: 'sf', name: 'Startup Founders',            status: 'draft', meta: '8 contacts · 3 templates',  sent: 0,  replied: 0, queued: 8,  color: '#F59E0B'      },
]

type ConvStatus = 'replied' | 'pending' | 'cold' | 'queued' | 'followup'

interface Convo {
  id: number; name: string; co: string; role: string
  avClass: string; initials: string; preview: string; time: string; status: ConvStatus
  thread: { dir: 'out' | 'in'; from: string; time: string; subject: string; body: string[]; meta?: string[] }[]
  draftReply: string
}

// Real Indian recruiter / HM data for Akash Lamba's job search
const buildThread = (
  userName: string,
  userEmail: string,
  recruiter: string,
  recruiterEmail: string,
  subject: string,
  outBody: string[],
  inBody?: string[],
  inTime?: string,
): Convo['thread'] => {
  const thread: Convo['thread'] = [{
    dir: 'out', from: `${userName} · ${userEmail}`,
    time: 'Mon · 10:30 AM', subject, body: outBody,
    meta: ['✓ Delivered', '✓ Opened 2×'],
  }]
  if (inBody) thread.push({ dir: 'in', from: `${recruiter} · ${recruiterEmail}`, time: inTime ?? 'Tue · 11:15 AM', subject: `Re: ${subject}`, body: inBody })
  return thread
}

const CONVERSATIONS: Convo[] = [
  {
    id: 1, name: 'Sneha Gupta', co: 'Deloitte India · Senior Recruiter', role: 'Senior Recruiter',
    avClass: 'av-violet', initials: 'SG',
    preview: 'Hi Akash — your consulting background is a strong fit. Happy to schedule a call this week.',
    time: '2h', status: 'replied',
    thread: buildThread(
      'Akash Lamba', 'lamba.akash1994@gmail.com',
      'Sneha Gupta', 'sneha.gupta@deloitte.com',
      'Interest in Strategy & Consulting Roles at Deloitte India',
      [
        'Hi Sneha,',
        "I've been following Deloitte India's expansion in digital consulting and BFSI and wanted to reach out directly. I have hands-on experience in strategy consulting and digital transformation — I've led cross-functional projects in the BFSI and enterprise space and have a track record of delivering impact for Fortune 500 clients.",
        "I noticed there are openings for Consultant – Strategy roles in Mumbai. I'd love to learn more and understand if my background could be a good fit for your team.",
        "Would you have 15 minutes for a quick call this week?",
        'Best,\nAkash Lamba\nlamba.akash1994@gmail.com',
      ],
      [
        'Hi Akash,',
        "Thank you for reaching out! Your consulting background does sound like a strong fit for what we're hiring for in our Strategy & Operations practice.",
        "I'd love to schedule a brief call — are you available Thursday or Friday between 11 AM and 1 PM IST? I'll share the JD in advance so you can come prepared.",
        '— Sneha',
      ],
      'Tue · 3:20 PM',
    ),
    draftReply: "Hi Sneha — Thursday at 11:30 AM IST works perfectly for me. Looking forward to the conversation and I'll review the JD beforehand. Sending a calendar invite now.\n\nBest,\nAkash",
  },
  {
    id: 2, name: 'Rahul Sharma', co: 'Razorpay · Talent Acquisition', role: 'Talent Acquisition',
    avClass: 'av-blue', initials: 'RS',
    preview: 'You: Following up on my note about the Backend PM opening at Razorpay — happy to share more context on my work.',
    time: '5h', status: 'pending',
    thread: buildThread(
      'Akash Lamba', 'lamba.akash1994@gmail.com',
      'Rahul Sharma', 'rahul.sharma@razorpay.com',
      'Exploring PM Opportunities at Razorpay — Payments & Growth',
      [
        'Hi Rahul,',
        "Razorpay's trajectory in the payments infrastructure space has been remarkable — especially the push into B2B banking products. I came across the Product Manager opening and wanted to reach out directly.",
        "I bring 4+ years of experience in product and consulting, with a focus on fintech and data-driven decision making. I've worked on projects that mirror the complexity Razorpay operates at — high-volume transaction flows, cross-functional alignment, and rapid iteration cycles.",
        "Would love to connect for a quick call if this looks like a potential fit.",
        'Regards,\nAkash Lamba',
      ],
    ),
    draftReply: "Hi Rahul — just wanted to follow up on my note from earlier this week. I know inboxes can get busy, so no pressure — but I'm genuinely excited about what Razorpay is building and would love a quick chat if timing works.\n\nBest,\nAkash",
  },
  {
    id: 3, name: 'Priya Agarwal', co: 'Swiggy · HR Manager', role: 'HR Manager',
    avClass: 'av-pink', initials: 'PA',
    preview: 'Thanks for reaching out, Akash! We do have a Senior PM role that could be a fit. Let me loop in the hiring manager.',
    time: '1d', status: 'replied',
    thread: buildThread(
      'Akash Lamba', 'lamba.akash1994@gmail.com',
      'Priya Agarwal', 'priya.agarwal@swiggy.in',
      'Senior PM Interest — Core Ordering Experience at Swiggy',
      [
        'Hi Priya,',
        "I've been an avid Swiggy user and I follow the product closely — the recent work on hyperlocal discovery and the loyalty layer is excellent. I wanted to reach out about PM opportunities on the core ordering team.",
        "With a background in product strategy and consulting, I've helped shape growth features for consumer internet products and have deep experience in 0-to-1 product launches. I believe my profile aligns well with what Swiggy looks for in senior hires.",
        "Would appreciate 15 minutes to connect if there's a relevant opening.",
        'Thanks,\nAkash Lamba',
      ],
      [
        'Hi Akash,',
        "Thanks for reaching out! We actually do have a Senior Product Manager opening on the core ordering experience team right now.",
        "Let me forward your profile to our hiring manager and we'll be in touch shortly. In the meantime, could you share your updated resume? That'll help speed things along.",
        '— Priya',
      ],
      'Wed · 9:45 AM',
    ),
    draftReply: "Hi Priya — thanks so much! I'm attaching my resume here. Really excited about this opportunity — please don't hesitate to reach out if you need anything else from my end.\n\nBest,\nAkash",
  },
  {
    id: 4, name: 'Vikram Singh', co: 'Infosys · Talent Acquisition Lead', role: 'Talent Acquisition Lead',
    avClass: 'av-amber', initials: 'VS',
    preview: 'You: Hi Vikram — reaching out about the Senior Consultant – Digital Transformation role at Infosys Pune.',
    time: '2d', status: 'queued',
    thread: buildThread(
      'Akash Lamba', 'lamba.akash1994@gmail.com',
      'Vikram Singh', 'vikram.singh@infosys.com',
      'Senior Consultant – Digital Transformation | Pune',
      [
        'Hi Vikram,',
        "I came across the Senior Consultant – Digital Transformation opening at Infosys Pune and wanted to reach out. I have 4+ years of experience in consulting, primarily around digital transformation for BFSI and enterprise clients.",
        "My work has involved leading cross-functional teams, managing stakeholder relationships, and delivering tangible outcomes across Agile programs. I hold relevant certifications and have an MBA background that complements the analytical rigor this role requires.",
        "Would love to learn more about the team and the kind of projects this role involves.",
        'Regards,\nAkash Lamba\nlamba.akash1994@gmail.com',
      ],
    ),
    draftReply: "Hi Vikram — hope this finds you well. Wanted to follow up on my earlier note about the Senior Consultant role. I'm very keen on this opportunity and happy to make time for a call at your convenience.\n\nBest,\nAkash",
  },
  {
    id: 5, name: 'Ananya Kapoor', co: 'CRED · People Team', role: 'Recruiter',
    avClass: 'av-green', initials: 'AK',
    preview: 'You: Following up — I know the hiring cycle can take time. Happy to share more about my fintech experience.',
    time: '3d', status: 'followup',
    thread: buildThread(
      'Akash Lamba', 'lamba.akash1994@gmail.com',
      'Ananya Kapoor', 'ananya.kapoor@cred.club',
      'Engineering Manager / Product Role Interest — CRED',
      [
        'Hi Ananya,',
        "CRED's product philosophy is something I've followed closely — the focus on premium UX and behavioural design is unlike anything in Indian fintech. I wanted to reach out about potential PM or strategy roles that might be opening up.",
        "My background spans consulting, product strategy, and cross-functional leadership — areas I believe align with CRED's current phase of growth into financial products.",
        "Happy to share more context if helpful.",
        'Best,\nAkash Lamba',
      ],
    ),
    draftReply: "Hi Ananya — following up on my note from last week. No pressure if timing isn't right, but I remain genuinely interested in CRED and would love to connect when you have bandwidth.\n\nThanks,\nAkash",
  },
  {
    id: 6, name: 'Rohan Mehta', co: 'Flipkart · HR Business Partner', role: 'HRBP',
    avClass: 'av-rose', initials: 'RM',
    preview: "Thank you for your interest, Akash. We'll keep your profile on file for future openings.",
    time: '5d', status: 'cold',
    thread: buildThread(
      'Akash Lamba', 'lamba.akash1994@gmail.com',
      'Rohan Mehta', 'rohan.mehta@flipkart.com',
      'UX / Product Strategy Roles at Flipkart',
      [
        'Hi Rohan,',
        "Flipkart's focus on next-gen mobile commerce is compelling and I've been following the design and product work closely. I'd love to explore if there are openings in the product or strategy space that fit my background.",
        'Best,\nAkash Lamba',
      ],
      [
        'Hi Akash,',
        "Thank you for reaching out. We've reviewed your background and while your profile is strong, we don't have an immediate opening that matches at this time. We'll keep your details on file.",
        'Best of luck with your search.',
        '— Rohan Mehta | Flipkart HR',
      ],
      'Thu · 5:10 PM',
    ),
    draftReply: "Hi Rohan — thank you for getting back to me. I completely understand. I'd love to stay on your radar as Flipkart grows — feel free to reach out anytime an opening comes up that fits my background.\n\nBest,\nAkash",
  },
  {
    id: 7, name: 'Kavya Nair', co: 'PhonePe · Talent Acquisition', role: 'Talent Acquisition',
    avClass: 'av-violet', initials: 'KN',
    preview: 'You: Hi Kavya — reaching out about the Growth PM opening at PhonePe for the insurance vertical.',
    time: '6d', status: 'pending',
    thread: buildThread(
      'Akash Lamba', 'lamba.akash1994@gmail.com',
      'Kavya Nair', 'kavya.nair@phonepe.com',
      'Growth PM — Insurance & Mutual Funds Vertical at PhonePe',
      [
        'Hi Kavya,',
        "PhonePe's expansion into insurance and wealth products is exactly the kind of high-impact vertical I want to work on. I came across the Growth PM opening and believe my background is a strong match.",
        "I have experience in data-driven growth strategy, stakeholder management, and product launches in fintech-adjacent environments. I understand the acquisition-activation-retention funnel well and have used SQL and analytics tools to drive decisions.",
        "Would love to connect for a short call.",
        'Best,\nAkash Lamba\nlamba.akash1994@gmail.com',
      ],
    ),
    draftReply: "Hi Kavya — hope you're having a good week. Just following up on my earlier note. I remain very interested in the Growth PM role and happy to jump on a call at any time that suits you.\n\nBest,\nAkash",
  },
  {
    id: 8, name: 'Arjun Patel', co: 'Groww · Talent Team', role: 'Recruiter',
    avClass: 'av-amber', initials: 'AP',
    preview: 'Hi Akash! Your profile looks interesting. Can you share your resume and a brief intro about your fintech experience?',
    time: '1w', status: 'replied',
    thread: buildThread(
      'Akash Lamba', 'lamba.akash1994@gmail.com',
      'Arjun Patel', 'arjun.patel@groww.in',
      'Full Stack / Product Roles at Groww',
      [
        'Hi Arjun,',
        "Groww's mission to make investing accessible to every Indian resonates deeply with me. I'm reaching out about product and strategy roles that might suit my profile.",
        "I bring a mix of consulting and product thinking — with strong analytical skills and experience working with fintech and consumer internet teams.",
        'Would love to connect.',
        'Thanks,\nAkash Lamba',
      ],
      [
        'Hi Akash!',
        "Your profile looks interesting — we do have a couple of product-adjacent openings right now.",
        "Could you share your updated resume and a quick note about your fintech experience? That'll help me route your profile to the right hiring manager.",
        '— Arjun | Groww Talent',
      ],
      'Mon · 2:05 PM',
    ),
    draftReply: "Hi Arjun — thanks for getting back! Attaching my resume here. Quick context on my fintech experience: I've worked on consulting and product strategy projects for BFSI clients, with a focus on digital adoption and data-driven growth. Happy to elaborate on a call.\n\nBest,\nAkash",
  },
]

const STATUS_LABEL: Record<ConvStatus, string> = {
  replied: 'REPLIED', pending: 'PENDING', cold: 'COLD', queued: 'QUEUED', followup: 'FOLLOW-UP',
}

type FilterKey = 'all' | ConvStatus
const FILTER_PILLS: [FilterKey, string, number][] = [
  ['all',      'All',           CONVERSATIONS.length],
  ['replied',  'Replied',       CONVERSATIONS.filter(c => c.status === 'replied').length],
  ['pending',  'Awaiting',      CONVERSATIONS.filter(c => c.status === 'pending').length],
  ['queued',   'Queued',        CONVERSATIONS.filter(c => c.status === 'queued').length],
  ['followup', 'Follow-up due', CONVERSATIONS.filter(c => c.status === 'followup').length],
  ['cold',     'Gone cold',     CONVERSATIONS.filter(c => c.status === 'cold').length],
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
          <span className="dot" />{STATUS_LABEL[c.status]}
        </span>
      </div>
    </div>
  )
}

function Timeline({ campName }: { campName: string }) {
  const steps = [
    { label: 'Initial email',    state: 'done',   n: '1' },
    { label: 'Reply received',   state: 'done',   n: '2' },
    { label: 'Draft follow-up',  state: 'now',    n: '3' },
    { label: 'Send Thu 10am',    state: 'future', n: '4' },
    { label: 'Final nudge',      state: 'future', n: '5' },
  ]
  return (
    <div className="ot-timeline">
      <div className="ot-timeline-head">
        <div className="t">SEQUENCE — {campName.toUpperCase()}</div>
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

function DetailPanel({ convo, campName }: { convo: Convo; campName: string }) {
  const [tone, setTone] = useState('Warm')
  const [showTones, setShowTones] = useState(false)
  const [, setDraft] = useState(convo.draftReply)

  // reset draft when conversation changes
  const currentDraft = convo.draftReply

  return (
    <div className="ot-col">
      <div className="ot-detail-head">
        <div className={`ot-av-lg ${convo.avClass}`}>{convo.initials}</div>
        <div>
          <div className="ot-nm">{convo.name} · {convo.co.split(' · ')[0]}</div>
          <div className="ot-role">{convo.role} · India · 2nd connection</div>
        </div>
        <div className="ot-actions">
          <button className="ot-icon-btn" title="Star"><IcoStar size={13} /></button>
          <button className="ot-icon-btn" title="Calendar"><IcoCal size={13} /></button>
          <button className="ot-icon-btn" title="Archive"><IcoArchive size={13} /></button>
          <button className="ot-icon-btn" title="More"><IcoDots size={13} /></button>
        </div>
      </div>

      <Timeline campName={campName} />

      <div className="ot-thread">
        {convo.thread.map((msg, i) => (
          <div key={i} className={`ot-msg ${msg.dir === 'out' ? 'outbound' : 'inbound'}`}>
            <div className="ot-msg-head">
              <span className="from">{msg.from}</span>
              <span className="time">{msg.time}</span>
            </div>
            <div className="ot-msg-subject">{msg.subject}</div>
            <div className="ot-msg-body">
              {msg.body.map((para, j) => <p key={j}>{para}</p>)}
            </div>
            {msg.meta && (
              <div className="ot-msg-meta">
                {msg.meta.map((m, j) => (
                  <span key={j} className={`item ${m.startsWith('✓') ? 'green' : ''}`}>
                    {m.startsWith('✓') && <IconCheck size={10} />} {m.replace('✓ ', '')}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ot-composer">
        <div className="ot-composer-head">
          <div className="ot-composer-left">
            <span className="ot-ai-tag"><IconSparkle size={11} /> AI DRAFTING</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>Replying to {convo.name.split(' ')[0]} · Variant 1 of 3</span>
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
            {['Warm', 'Direct', 'Curious', 'Formal', 'Confident'].map(t => (
              <button key={t} className="ot-var-chip"
                onClick={() => { setTone(t); setShowTones(false) }}
                style={t === tone ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--blue-50)' } : {}}
              >{t}</button>
            ))}
          </div>
        )}

        <div className="ot-composer-draft">
          {currentDraft.split('\n').map((line, i) => (
            <span key={i}>{line}{i < currentDraft.split('\n').length - 1 && <br />}</span>
          ))}
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
            <button className="ot-regen-btn" onClick={() => setDraft(currentDraft)}><IcoWand size={12} /> Regenerate</button>
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
  const firstName = user?.name?.split(' ')[0] ?? 'Akash'

  const totalSent    = CAMPAIGNS.reduce((s, c) => s + c.sent, 0)
  const totalReplied = CAMPAIGNS.reduce((s, c) => s + c.replied, 0)
  const replyRate    = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0

  const [activeCamp, setActiveCamp] = useState('cs')
  const [activeConv, setActiveConv] = useState(1)
  const [filter, setFilter]         = useState<FilterKey>('all')
  const [search, setSearch]         = useState('')

  const activeCampName = CAMPAIGNS.find(c => c.id === activeCamp)?.name ?? 'Consulting & Strategy Roles'

  const filteredConvos = CONVERSATIONS.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.co.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const activeConvoData = CONVERSATIONS.find(c => c.id === activeConv) ?? CONVERSATIONS[0]

  return (
    <>
      <div className="ot-head-row">
        <div>
          <div className="ot-eyebrow"><span className="dot" /> {CONVERSATIONS.filter(c => c.status === 'replied').length} active replies this week</div>
          <h1 className="ot-h1">The Inside <span className="ot-serif-accent">Track.</span></h1>
          <p className="ot-lede">
            You've sent <b>{totalSent} personalized emails</b> this month and earned <b>{totalReplied} replies</b> — a reply rate{' '}
            <b>{replyRate}% ({(replyRate / 14).toFixed(1)}× the industry average)</b>.
            {` Keep going, ${firstName}.`}
          </p>
        </div>
        <div className="ot-perf-tiles">
          <div className="ot-perf-tile"><div className="num">{replyRate}%</div><div className="lbl">REPLY RATE</div></div>
          <div className="ot-perf-tile"><div className="num">{CONVERSATIONS.filter(c => c.status === 'replied').length}</div><div className="lbl">ACTIVE REPLIES</div></div>
          <div className="ot-perf-tile"><div className="num">{CAMPAIGNS.filter(c => c.status === 'live').length}</div><div className="lbl">LIVE CAMPAIGNS</div></div>
        </div>
      </div>

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
          <input placeholder="Search by name, company, role…" value={search} onChange={e => setSearch(e.target.value)} />
          <span className="ot-kbd">⌘K</span>
        </div>
      </div>

      <div className="ot-workspace">
        {/* Campaigns */}
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

        {/* Conversations */}
        <div className="ot-col">
          <div className="ot-col-head">
            <h3>Conversations · {activeCampName}</h3>
            <div className="ot-reply-badge">
              <div className="ot-reply-ring"><div className="v">{replyRate}%</div></div>
              <span className="up">↑ vs avg</span>
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

        {/* Detail */}
        <DetailPanel key={activeConvoData.id} convo={activeConvoData} campName={activeCampName} />
      </div>
    </>
  )
}
