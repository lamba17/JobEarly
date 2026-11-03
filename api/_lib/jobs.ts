// Live job listings for the Find Jobs page, shared by server.ts (local dev) and api/jobs.ts.
//   local  -> JSearch from OpenWeb Ninja (needs OPENWEBNINJA_API_KEY), which reads Google for Jobs listings by city and country
//   remote -> Remotive public feed (no key). Remotive asks API users to link back and to fetch the
//             feed only a few times a day, so the whole feed is cached and filtered here.
import { BillingError } from './billing.js'

export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  /** Remote jobs often restrict who may apply, e.g. "USA Only". Empty when not stated. */
  eligibility: string
  description: string
  url: string
  postedAt: string
  salary: string
  type: string
  source: 'JSearch' | 'Remotive' | 'Himalayas'
  sourceUrl: string
}

const CACHE = new Map<string, { at: number; value: unknown }>()
function cached<T>(key: string, maxAgeMs: number): T | null {
  const hit = CACHE.get(key)
  return hit && Date.now() - hit.at < maxAgeMs ? (hit.value as T) : null
}
function remember(key: string, value: unknown) {
  if (CACHE.size > 200) CACHE.delete(CACHE.keys().next().value as string)
  CACHE.set(key, { at: Date.now(), value })
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(br|\/p|\/li|\/h\d)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim()
}

function money(min?: number, max?: number, currency = ''): string {
  const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
  if (min && max && min !== max) return `${currency}${fmt(min)} – ${currency}${fmt(max)}`
  const one = max || min
  return one ? `${currency}${fmt(one)}` : ''
}

/** True when the listing's employer name contains what the person typed (ignores case, spacing and punctuation). */
export function matchesCompany(employer: string, wanted: string): boolean {
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const w = norm(wanted)
  return !w || norm(employer).includes(w)
}

export async function searchLocalJobs(opts: { country: string; where: string; what: string; company: string; page: number; distanceKm: number }): Promise<JobListing[]> {
  const key = process.env.OPENWEBNINJA_API_KEY
  if (!key) throw new BillingError(503, 'Local job search is not set up yet.')
  if (!/^[a-z]{2}$/i.test(opts.country)) throw new BillingError(400, 'Pick a country to search in.')

  // JSearch takes one free-text query; "role in city" is how it expects a location.
  const query = [opts.what || 'jobs', opts.company && `at ${opts.company}`, opts.where && `in ${opts.where}`].filter(Boolean).join(' ')
  const params = new URLSearchParams({
    query,
    page: String(Math.max(1, opts.page)),
    num_pages: '1',
    country: opts.country.toLowerCase(),
    date_posted: 'month',
  })
  if (opts.where) params.set('radius', String(opts.distanceKm))

  // The free plan allows only a couple of hundred searches a month, so repeat searches come from memory.
  const cacheKey = `jsearch:${params}`
  const hit = cached<JobListing[]>(cacheKey, 60 * 60 * 1000)
  if (hit) return hit

  const res = await fetch(`https://api.openwebninja.com/jsearch/search?${params}`, {
    headers: { 'x-api-key': key, Accept: 'application/json' },
  })
  if (res.status === 429) throw new BillingError(503, 'Local job search is busy right now. Please try again later, or use Remote jobs.')
  if (!res.ok) {
    console.error('JSearch error:', res.status)
    throw new BillingError(502, 'The job search service did not respond. Please try again in a moment.')
  }
  const json: any = await res.json()
  const jobs: JobListing[] = (json.data ?? []).map((r: any): JobListing => {
    const place = [r.job_city, r.job_state, r.job_country].filter(Boolean).join(', ')
    const period = r.job_salary_period ? ` / ${String(r.job_salary_period).toLowerCase()}` : ''
    const cur = r.job_salary_currency ? `${r.job_salary_currency} ` : ''
    const pay = money(r.job_min_salary || undefined, r.job_max_salary || undefined, cur)
    return {
      id: `jsearch-${r.job_id}`,
      title: String(r.job_title ?? ''),
      company: r.employer_name ?? 'Company not listed',
      location: r.job_is_remote && !place ? 'Remote' : place || opts.where,
      remote: !!r.job_is_remote,
      eligibility: '',
      description: String(r.job_description ?? '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim(),
      url: r.job_apply_link ?? r.job_google_link ?? '',
      postedAt: r.job_posted_at_datetime_utc ?? '',
      salary: pay ? pay + period : '',
      type: String(r.job_employment_type ?? '').replace(/_/g, ' ').toLowerCase(),
      source: 'JSearch',
      sourceUrl: 'https://www.openwebninja.com',
    }
  }).filter((j: JobListing) => j.title && j.url && matchesCompany(j.company, opts.company))

  remember(cacheKey, jobs)
  return jobs
}

async function remotiveJobs(opts: { what: string; country: string; company: string }): Promise<JobListing[]> {
  let feed = cached<JobListing[]>('remotive:all', 3 * 60 * 60 * 1000)
  if (!feed) {
    const res = await fetch('https://remotive.com/api/remote-jobs', { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      console.error('Remotive error:', res.status)
      throw new BillingError(502, 'The remote job feed did not respond. Please try again in a moment.')
    }
    const json: any = await res.json()
    feed = (json.jobs ?? []).map((r: any): JobListing => ({
      id: `remotive-${r.id}`,
      title: String(r.title ?? ''),
      company: r.company_name ?? 'Company not listed',
      location: r.candidate_required_location || 'Worldwide',
      remote: true,
      eligibility: r.candidate_required_location ?? '',
      description: stripHtml(String(r.description ?? '')),
      url: r.url,
      postedAt: r.publication_date ?? '',
      salary: r.salary ?? '',
      type: String(r.job_type ?? '').replace(/_/g, ' '),
      source: 'Remotive',
      sourceUrl: 'https://remotive.com',
    })).filter((j: JobListing) => j.title && j.url)
    remember('remotive:all', feed)
  }

  const words = opts.what.toLowerCase().split(/\s+/).filter(w => w.length > 1)
  const country = COUNTRY_NAMES[opts.country.toLowerCase()] ?? ''
  let list = feed!
  if (words.length) {
    // Title or tag-like words must all appear in title/company/description start, so "react developer" finds React roles.
    list = list.filter(j => {
      const hay = `${j.title} ${j.company} ${j.description.slice(0, 600)}`.toLowerCase()
      return words.every(w => hay.includes(w))
    })
  }
  if (opts.company) list = list.filter(j => matchesCompany(j.company, opts.company))
  if (country) {
    // Keep jobs a person in that country may actually apply to: worldwide ones and ones naming the country or its region.
    list = list.filter(j => isOpenTo(j.eligibility, country))
  }
  return list
}

/** Himalayas: a large remote board with server-side search and a country filter. */
async function himalayasJobs(opts: { what: string; country: string; company: string; page: number }): Promise<{ jobs: JobListing[]; total: number }> {
  const params = new URLSearchParams({ sort: 'recent', page: String(opts.page) })
  const q = [opts.what, opts.company].filter(Boolean).join(' ')
  if (q) params.set('q', q)
  if (opts.country) params.set('country', opts.country.toUpperCase())
  const cacheKey = `himalayas:${params}`
  const hit = cached<{ jobs: JobListing[]; total: number }>(cacheKey, 10 * 60 * 1000)
  if (hit) return hit

  const res = await fetch(`https://himalayas.app/jobs/api/search?${params}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Himalayas ${res.status}`)
  const json: any = await res.json()
  const jobs: JobListing[] = (json.jobs ?? []).map((r: any): JobListing => {
    const places: string[] = Array.isArray(r.locationRestrictions) ? r.locationRestrictions : []
    return {
      id: `himalayas-${String(r.guid ?? r.applicationLink).split('/').pop()}`,
      title: String(r.title ?? ''),
      company: r.companyName ?? 'Company not listed',
      location: places.length ? places.join(', ') : 'Worldwide',
      remote: true,
      eligibility: places.join(', '),
      description: stripHtml(String(r.description ?? r.excerpt ?? '')),
      url: r.applicationLink ?? r.guid,
      postedAt: r.pubDate ? new Date(Number(r.pubDate) * 1000).toISOString() : '',
      salary: money(Number(r.minSalary) || undefined, Number(r.maxSalary) || undefined, r.currency ? `${r.currency} ` : ''),
      type: String(r.employmentType ?? ''),
      source: 'Himalayas',
      sourceUrl: 'https://himalayas.app',
    }
  }).filter((j: JobListing) => j.title && j.url && matchesCompany(j.company, opts.company))
  const out = { jobs, total: Number(json.totalCount) || jobs.length }
  remember(cacheKey, out)
  return out
}

export async function searchRemoteJobs(opts: { what: string; country: string; company: string; page: number }): Promise<{ jobs: JobListing[]; total: number }> {
  const countryName = COUNTRY_NAMES[opts.country.toLowerCase()] ?? ''
  const [him, rem] = await Promise.allSettled([
    himalayasJobs({ what: opts.what, country: opts.country, company: opts.company, page: opts.page }),
    opts.page === 1 ? remotiveJobs({ what: opts.what, country: opts.country, company: opts.company }) : Promise.resolve([] as JobListing[]),
  ])
  if (him.status === 'rejected' && rem.status === 'rejected') {
    console.error('Remote feeds failed:', him.reason, rem.reason)
    throw new BillingError(502, 'The remote job feeds did not respond. Please try again in a moment.')
  }
  const fromHim = him.status === 'fulfilled' ? him.value : { jobs: [], total: 0 }
  const fromRem = rem.status === 'fulfilled' ? rem.value : []

  // The same role can appear on both boards; keep one.
  const seen = new Set(fromHim.jobs.map(j => `${j.title}|${j.company}`.toLowerCase()))
  const extra = fromRem.filter(j => !seen.has(`${j.title}|${j.company}`.toLowerCase())
    && (!countryName || isOpenTo(j.eligibility, countryName)))
  const jobs = [...fromHim.jobs, ...extra].sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt))
  return { jobs, total: fromHim.total + extra.length }
}

const COUNTRY_NAMES: Record<string, string> = {
  in: 'india', us: 'usa', gb: 'uk', ca: 'canada', au: 'australia', nz: 'new zealand', sg: 'singapore',
  de: 'germany', fr: 'france', it: 'italy', nl: 'netherlands', at: 'austria', es: 'spain', be: 'belgium',
  pl: 'poland', br: 'brazil', za: 'south africa', mx: 'mexico', ch: 'switzerland',
}

const REGION_OF: Record<string, string[]> = {
  india: ['apac', 'asia'],
  usa: ['north america', 'americas', 'us', 'united states'],
  canada: ['north america', 'americas'],
  uk: ['europe', 'emea', 'united kingdom'],
  germany: ['europe', 'emea', 'eu'], france: ['europe', 'emea', 'eu'], italy: ['europe', 'emea', 'eu'],
  netherlands: ['europe', 'emea', 'eu'], austria: ['europe', 'emea', 'eu'], spain: ['europe', 'emea', 'eu'],
  belgium: ['europe', 'emea', 'eu'], poland: ['europe', 'emea', 'eu'], switzerland: ['europe', 'emea'],
  australia: ['apac', 'oceania'], 'new zealand': ['apac', 'oceania'], singapore: ['apac', 'asia'],
  brazil: ['latam', 'south america', 'americas'], mexico: ['latam', 'north america', 'americas'],
  'south africa': ['emea', 'africa'],
}

/** True when the job's stated eligibility is open to someone living in `country` (lower-case name). */
export function isOpenTo(eligibility: string, country: string): boolean {
  const e = eligibility.toLowerCase().trim()
  if (!e || /worldwide|anywhere|global|any location/.test(e)) return true
  if (e.includes(country)) return true
  // "USA Only" style restrictions never match another country; region-level ones may.
  return (REGION_OF[country] ?? []).some(r => new RegExp(`\\b${r}\\b`).test(e))
}
