// Turns raw query-string values into a job search, so api/jobs.ts and server.ts behave identically.
import { authenticate, userIsPro, BillingError } from './billing.js'
import { searchLocalJobs, searchRemoteJobs, type JobListing } from './jobs.js'

export interface JobsQuery {
  mode: string; q: string; where: string; country: string; page: string; distance: string
}

/** Find Jobs is a Pro feature: check the session and the plan before any search is paid for. */
export async function requirePro(authHeader: string | undefined) {
  const user = await authenticate(authHeader)
  if (!(await userIsPro(user.id))) throw new BillingError(403, 'Find Jobs is a Pro feature. Upgrade to search jobs.')
}

export async function findJobs(query: JobsQuery): Promise<{ jobs: JobListing[]; total: number | null; page: number }> {
  const page = Math.min(20, Math.max(1, parseInt(query.page, 10) || 1))
  const what = query.q.trim().slice(0, 80)
  const country = query.country.trim().slice(0, 2).toLowerCase()

  if (query.mode === 'remote') {
    const r = await searchRemoteJobs({ what, country, page })
    return { jobs: r.jobs, total: r.total, page }
  }
  if (query.mode === 'local') {
    const where = query.where.trim().slice(0, 80)
    if (!where) throw new BillingError(400, 'Enter a city to search near.')
    const distance = Math.min(100, Math.max(5, parseInt(query.distance, 10) || 25))
    const jobs = await searchLocalJobs({ country, where, what, page, distanceKm: distance })
    return { jobs, total: null, page }
  }
  throw new BillingError(400, 'Unknown search mode.')
}
