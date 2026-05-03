import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string
            scope: string
            callback: (r: { access_token: string }) => void
            error_callback?: (e: { type: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ')

export type ThreadStatus = 'no-reply' | 'replied' | 'interview' | 'offer' | 'rejected'

export interface GmailMessage {
  id: string
  from: string
  fromEmail: string
  to: string
  subject: string
  date: string
  snippet: string
  body: string
  isFromMe: boolean
  isRead: boolean
}

export interface HRThread {
  id: string
  subject: string
  from: string
  fromEmail: string
  company: string
  date: string
  snippet: string
  messages: GmailMessage[]
  status: ThreadStatus
  isRead: boolean
  messageCount: number
}

export interface SendParams {
  to: string
  subject: string
  body: string
  threadId?: string
  inReplyTo?: string
}

interface GmailCtx {
  isConnected: boolean
  userEmail: string | null
  connecting: boolean
  syncing: boolean
  syncedAt: Date | null
  threads: HRThread[]
  hasClientId: boolean
  connect: () => void
  disconnect: () => void
  syncThreads: () => Promise<void>
  sendEmail: (p: SendParams) => Promise<void>
  markRead: (threadId: string) => Promise<void>
}

const Ctx = createContext<GmailCtx>({} as GmailCtx)

// ── Helpers ────────────────────────────────────────────────────────────────────
function extractEmail(str: string) {
  return str.match(/<(.+?)>/)?.[1] ?? str.trim()
}
function extractName(str: string) {
  return str.match(/^(.+?)\s*</)?.[1]?.replace(/"/g, '').trim() ?? str.trim()
}
function getHeader(headers: { name: string; value: string }[], name: string) {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}
function decodeB64(data: string): string {
  try {
    const bin = atob(data.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new TextDecoder('utf-8').decode(bytes)
  } catch { return '' }
}
function extractBody(payload: any): string {
  if (!payload) return ''
  if (payload.body?.data) return decodeB64(payload.body.data)
  if (payload.parts) {
    for (const part of payload.parts) {
      if ((part.mimeType === 'text/html' || part.mimeType === 'text/plain') && part.body?.data) {
        return decodeB64(part.body.data)
      }
      const nested = extractBody(part)
      if (nested) return nested
    }
  }
  return ''
}

function detectStatus(messages: GmailMessage[], myEmail: string): ThreadStatus {
  const text = messages.map(m => `${m.subject} ${m.body} ${m.snippet}`).join(' ').toLowerCase()
  if (/pleased to offer|job offer|offer letter|extend an offer/.test(text)) return 'offer'
  if (/interview|schedule a call|video call|google meet|zoom link|meet with our|meet the team/.test(text)) return 'interview'
  if (/unfortunately|not moving forward|other candidates|not selected|regret to inform|decided to move/.test(text)) return 'rejected'
  const hasIncoming = messages.some(m => !m.isFromMe && m.fromEmail.toLowerCase() !== myEmail.toLowerCase())
  return hasIncoming ? 'replied' : 'no-reply'
}

function guessCompany(fromEmail: string): string {
  const domain = fromEmail.split('@')[1] ?? ''
  if (!domain) return 'Unknown'
  const KNOWN: Record<string, string> = {
    'google.com': 'Google', 'amazon.com': 'Amazon', 'amazon.in': 'Amazon',
    'microsoft.com': 'Microsoft', 'apple.com': 'Apple', 'meta.com': 'Meta',
    'netflix.com': 'Netflix', 'stripe.com': 'Stripe', 'airbnb.com': 'Airbnb',
    'uber.com': 'Uber', 'figma.com': 'Figma', 'notion.so': 'Notion',
    'vercel.com': 'Vercel', 'swiggy.in': 'Swiggy', 'zomato.com': 'Zomato',
    'flipkart.com': 'Flipkart', 'phonepe.com': 'PhonePe', 'paytm.com': 'Paytm',
    'cred.club': 'CRED', 'razorpay.com': 'Razorpay', 'freshworks.com': 'Freshworks',
    'linkedin.com': 'LinkedIn', 'atlassian.com': 'Atlassian', 'infosys.com': 'Infosys',
    'wipro.com': 'Wipro', 'tcs.com': 'TCS', 'meesho.com': 'Meesho',
    'groww.in': 'Groww', 'myntra.com': 'Myntra', 'nykaa.com': 'Nykaa',
    'zepto.com': 'Zepto', 'zeptonow.com': 'Zepto', 'sharechat.com': 'ShareChat',
    'deloitte.com': 'Deloitte', 'shopify.com': 'Shopify',
    'noreply': '', 'no-reply': '', 'donotreply': '',
  }
  const match = Object.keys(KNOWN).find(k => domain.includes(k))
  if (match) return KNOWN[match] || domain.split('.')[0]
  const base = domain.split('.')[0]
  return base.charAt(0).toUpperCase() + base.slice(1)
}

export function GmailProvider({ children }: { children: ReactNode }) {
  const [token,      setToken]      = useState<string | null>(() => sessionStorage.getItem('gm_tok'))
  const [userEmail,  setUserEmail]  = useState<string | null>(() => sessionStorage.getItem('gm_email'))
  const [connecting, setConnecting] = useState(false)
  const [syncing,    setSyncing]    = useState(false)
  const [syncedAt,   setSyncedAt]   = useState<Date | null>(null)
  const [threads,    setThreads]    = useState<HRThread[]>([])
  const [tokenClient,setTokenClient]= useState<any>(null)

  useEffect(() => {
    const init = () => {
      if (!CLIENT_ID || !window.google) return
      const tc = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (r) => {
          const tok = r.access_token
          setToken(tok)
          sessionStorage.setItem('gm_tok', tok)
          try {
            const info = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
              headers: { Authorization: `Bearer ${tok}` },
            }).then(r => r.json())
            setUserEmail(info.email)
            sessionStorage.setItem('gm_email', info.email)
          } catch { /* user info not critical */ }
          setConnecting(false)
        },
        error_callback: () => setConnecting(false),
      })
      setTokenClient(tc)
    }

    if (window.google) { init(); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = init
    document.head.appendChild(s)
  }, [])

  const api = useCallback(async (path: string, opts: RequestInit = {}) => {
    if (!token) throw new Error('Not authenticated')
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(opts.headers ?? {}),
      },
    })
    if (res.status === 401) {
      setToken(null); sessionStorage.removeItem('gm_tok')
      throw new Error('Session expired. Please reconnect Gmail.')
    }
    if (!res.ok) throw new Error(`Gmail API error ${res.status}`)
    return res.json()
  }, [token])

  const connect = useCallback(() => {
    if (!CLIENT_ID) {
      alert('Google Client ID not configured.\nAdd VITE_GOOGLE_CLIENT_ID to your .env file.\nSee .env.example for instructions.')
      return
    }
    setConnecting(true)
    tokenClient?.requestAccessToken()
  }, [tokenClient])

  const disconnect = useCallback(() => {
    setToken(null); setUserEmail(null); setThreads([])
    sessionStorage.removeItem('gm_tok'); sessionStorage.removeItem('gm_email')
  }, [])

  const syncThreads = useCallback(async () => {
    if (!token || !userEmail) return
    setSyncing(true)
    try {
      const q = 'subject:(job OR offer OR opportunity OR interview OR application OR hiring OR position OR role OR resume OR shortlisted OR selected)'
      const data = await api(`/threads?maxResults=30&q=${encodeURIComponent(q)}`)
      if (!data.threads?.length) { setThreads([]); setSyncedAt(new Date()); return }

      const results: HRThread[] = []
      for (const t of data.threads.slice(0, 25)) {
        try {
          const detail = await api(`/threads/${t.id}?format=full`)
          const messages: GmailMessage[] = detail.messages.map((msg: any) => {
            const h = msg.payload.headers
            const from = getHeader(h, 'from')
            return {
              id: msg.id,
              from: extractName(from),
              fromEmail: extractEmail(from),
              to: getHeader(h, 'to'),
              subject: getHeader(h, 'subject'),
              date: getHeader(h, 'date'),
              snippet: msg.snippet ?? '',
              body: extractBody(msg.payload),
              isFromMe: extractEmail(from).toLowerCase() === userEmail.toLowerCase(),
              isRead: !msg.labelIds?.includes('UNREAD'),
            }
          })
          const first = messages[0]
          const last  = messages[messages.length - 1]
          const hrMsg = messages.find(m => !m.isFromMe) ?? first
          results.push({
            id: t.id,
            subject: first?.subject ?? '(no subject)',
            from: hrMsg?.from ?? '',
            fromEmail: hrMsg?.fromEmail ?? '',
            company: guessCompany(hrMsg?.fromEmail ?? ''),
            date: last?.date ?? first?.date ?? '',
            snippet: last?.snippet || t.snippet || '',
            messages,
            status: detectStatus(messages, userEmail),
            isRead: messages.every(m => m.isRead),
            messageCount: messages.length,
          })
        } catch { /* skip malformed threads */ }
      }
      setThreads(results)
      setSyncedAt(new Date())
    } catch (err) {
      console.error('Gmail sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }, [token, userEmail, api])

  // Auto-sync once on connect
  useEffect(() => {
    if (token && userEmail && threads.length === 0) syncThreads()
  }, [token, userEmail]) // intentional: only trigger on connect

  const sendEmail = useCallback(async (p: SendParams) => {
    const lines = [
      `From: ${userEmail}`,
      `To: ${p.to}`,
      `Subject: ${p.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      ...(p.inReplyTo ? [`In-Reply-To: <${p.inReplyTo}>`, `References: <${p.inReplyTo}>`] : []),
      '',
      p.body,
    ]
    const raw = lines.join('\r\n')
    const bytes = new TextEncoder().encode(raw)
    const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    await api('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ raw: b64, ...(p.threadId ? { threadId: p.threadId } : {}) }),
    })
  }, [api, userEmail])

  const markRead = useCallback(async (threadId: string) => {
    try {
      await api(`/threads/${threadId}/modify`, {
        method: 'POST',
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
      })
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, isRead: true } : t))
    } catch { /* non-critical */ }
  }, [api])

  return (
    <Ctx.Provider value={{
      isConnected: !!token, userEmail, connecting, syncing, syncedAt,
      threads, hasClientId: !!CLIENT_ID,
      connect, disconnect, syncThreads, sendEmail, markRead,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useGmail = () => useContext(Ctx)
