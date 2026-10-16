// One place that says which pages search engines should index, and what each one is called.
// Used by: RouteSeo (client-side title/meta), the prerender step (static HTML + sitemap.xml).
// Pages not listed here (the signed-in app, sign-in, password reset...) are marked noindex.

export const SITE_URL = 'https://www.getjobearly.com'
export const SITE_NAME = 'JobEarly'
export const OG_IMAGE = `${SITE_URL}/brand/og-image.png`

export interface SeoRoute {
  path: string
  /** Aim for 60 characters or fewer */
  title: string
  /** Aim for 155 characters or fewer */
  description: string
  /** sitemap.xml priority, 0–1 */
  priority: number
}

export const SEO_ROUTES: SeoRoute[] = [
  {
    path: '/',
    title: 'JobEarly — AI Resume Builder, ATS Checker & Job Tracker',
    description: 'Tailor your resume to every job, beat ATS filters, write cover letters, reach recruiters and track applications — all in one AI workspace. Start free.',
    priority: 1.0,
  },
  {
    path: '/signup',
    title: 'Sign up free | JobEarly',
    description: 'Create your free JobEarly account: tailor a resume with AI, check your ATS score and start organising your job search in minutes.',
    priority: 0.8,
  },
  {
    path: '/about',
    title: 'About JobEarly | AI Job Application Platform',
    description: "JobEarly builds tools for people who don't want to wait their turn in the job market: AI-tailored resumes, ATS scoring, cover letters and outreach.",
    priority: 0.6,
  },
  {
    path: '/customers',
    title: 'Customers | JobEarly',
    description: "See how candidates use JobEarly's AI resume tailoring, ATS scoring and recruiter outreach to land their next role.",
    priority: 0.5,
  },
  {
    path: '/contact',
    title: 'Contact JobEarly | Support & Partnerships',
    description: 'Questions about JobEarly, billing, bugs or partnerships? Get in touch with the team — we read everything.',
    priority: 0.5,
  },
  {
    path: '/careers',
    title: 'Careers at JobEarly',
    description: 'Interested in working on the AI platform that gets people hired before everyone else? See how to join the JobEarly team.',
    priority: 0.4,
  },
  {
    path: '/press',
    title: 'Press | JobEarly',
    description: 'Press information and media contact for JobEarly, the AI-powered job application platform.',
    priority: 0.3,
  },
  {
    path: '/refund',
    title: 'Refund & Cancellation Policy | JobEarly',
    description: 'How JobEarly Pro payments, refunds and cancellations work: a 7-day refund on your first payment and no automatic renewals.',
    priority: 0.3,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | JobEarly',
    description: 'What data JobEarly collects, how it is used and protected, and the choices you have over your resume and account data.',
    priority: 0.3,
  },
  {
    path: '/terms',
    title: 'Terms of Service | JobEarly',
    description: 'The terms for using JobEarly, including plans, billing, acceptable use and availability.',
    priority: 0.3,
  },
  {
    path: '/security',
    title: 'Security | JobEarly',
    description: 'How JobEarly protects your resume and job-search data: encryption, access controls and how to report a vulnerability.',
    priority: 0.3,
  },
  {
    path: '/dpa',
    title: 'Data Processing Addendum | JobEarly',
    description: "JobEarly's data processing terms for teams and organisations that need a DPA.",
    priority: 0.2,
  },
  {
    path: '/cookies',
    title: 'Cookie Policy | JobEarly',
    description: 'The minimal cookies and browser storage JobEarly uses, and how you can control them.',
    priority: 0.2,
  },
]

export const SEO_BY_PATH: Record<string, SeoRoute> = Object.fromEntries(SEO_ROUTES.map(r => [r.path, r]))

export const DEFAULT_TITLE = SITE_NAME

export function canonicalUrl(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path.replace(/\/$/, '')}`
}
