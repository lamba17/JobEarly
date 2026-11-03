import { supabase } from './supabaseClient'

export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  eligibility: string
  description: string
  url: string
  postedAt: string
  salary: string
  type: string
  source: 'JSearch' | 'Remotive' | 'Himalayas'
  sourceUrl: string
}

export interface JobFit {
  score: number
  verdict: 'apply' | 'stretch' | 'skip'
  summary: string
  strengths: string[]
  gaps: string[]
  tip: string
}

async function authed<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.')
  return json as T
}

export function searchJobs(p: { mode: 'local' | 'remote'; q: string; company?: string; where?: string; country: string; page?: number; distance?: number }) {
  const qs = new URLSearchParams({ mode: p.mode, q: p.q, country: p.country, page: String(p.page ?? 1) })
  if (p.where) qs.set('where', p.where)
  if (p.company) qs.set('company', p.company)
  if (p.distance) qs.set('distance', String(p.distance))
  return authed<{ jobs: JobListing[]; total: number | null; page: number }>(`/api/jobs?${qs}`)
}

export function jobFit(resumeText: string, job: Pick<JobListing, 'title' | 'company' | 'description'>) {
  return authed<JobFit>('/api/job-fit', { method: 'POST', body: JSON.stringify({ resumeText, job }) })
}

export function daysAgo(iso: string): string {
  const t = new Date(iso).getTime()
  if (!t) return ''
  const d = Math.floor((Date.now() - t) / 86400000)
  if (d <= 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

export const COUNTRIES: { code: string; name: string; local: boolean }[] = [
  { code: 'IN', name: 'India', local: true }, { code: 'US', name: 'United States', local: true },
  { code: 'GB', name: 'United Kingdom', local: true }, { code: 'CA', name: 'Canada', local: true },
  { code: 'AU', name: 'Australia', local: true }, { code: 'SG', name: 'Singapore', local: true },
  { code: 'DE', name: 'Germany', local: true }, { code: 'FR', name: 'France', local: true },
  { code: 'NL', name: 'Netherlands', local: true }, { code: 'NZ', name: 'New Zealand', local: true },
  { code: 'ZA', name: 'South Africa', local: true }, { code: 'IT', name: 'Italy', local: true },
  { code: 'ES', name: 'Spain', local: true }, { code: 'PL', name: 'Poland', local: true },
  { code: 'BR', name: 'Brazil', local: true }, { code: 'MX', name: 'Mexico', local: true },
  { code: 'AT', name: 'Austria', local: true }, { code: 'CH', name: 'Switzerland', local: true },
  { code: 'BE', name: 'Belgium', local: true },
]

/** Best guess of the visitor's country from their time zone, used until they pick one. */
export function guessCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (/Kolkata|Calcutta/.test(tz)) return 'IN'
    if (/London/.test(tz)) return 'GB'
    if (/Toronto|Vancouver|Montreal|Edmonton|Winnipeg|Halifax/.test(tz)) return 'CA'
    if (/Sydney|Melbourne|Brisbane|Perth|Adelaide/.test(tz)) return 'AU'
    if (/Singapore/.test(tz)) return 'SG'
    if (/Berlin/.test(tz)) return 'DE'
    if (/Paris/.test(tz)) return 'FR'
    if (/Amsterdam/.test(tz)) return 'NL'
    if (/Auckland/.test(tz)) return 'NZ'
    if (/Johannesburg/.test(tz)) return 'ZA'
    if (tz.startsWith('America/')) return 'US'
  } catch { /* fall through */ }
  return 'IN'
}
