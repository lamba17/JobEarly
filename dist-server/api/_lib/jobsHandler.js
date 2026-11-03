// Turns raw query-string values into a job search, so api/jobs.ts and server.ts behave identically.
import { BillingError } from './billing.js';
import { searchLocalJobs, searchRemoteJobs } from './jobs.js';
export async function findJobs(query) {
    const page = Math.min(20, Math.max(1, parseInt(query.page, 10) || 1));
    const what = query.q.trim().slice(0, 80);
    const country = query.country.trim().slice(0, 2).toLowerCase();
    if (query.mode === 'remote') {
        const r = await searchRemoteJobs({ what, country, page });
        return { jobs: r.jobs, total: r.total, page };
    }
    if (query.mode === 'local') {
        const where = query.where.trim().slice(0, 80);
        if (!where)
            throw new BillingError(400, 'Enter a city to search near.');
        const distance = Math.min(100, Math.max(5, parseInt(query.distance, 10) || 25));
        const jobs = await searchLocalJobs({ country, where, what, page, distanceKm: distance });
        return { jobs, total: null, page };
    }
    throw new BillingError(400, 'Unknown search mode.');
}
