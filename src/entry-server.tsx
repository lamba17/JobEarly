// Server entry used only at build time by scripts/prerender.mjs to turn the public pages into real
// HTML. It deliberately imports ONLY the public pages (not the signed-in app, which pulls in
// browser-only libraries such as the PDF reader).
import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Landing, { FAQS } from './pages/Landing'
import SignUp from './pages/SignUp'
import { Privacy, Terms, Security, Dpa, Cookies, Refund } from './pages/LegalPages'
import { About, Careers, Customers, Press, Contact } from './pages/CompanyPages'
import { SITE_URL, SITE_NAME } from './seo/routes'

export { SEO_ROUTES, SITE_URL, OG_IMAGE } from './seo/routes'

const noop = () => {}
const theme = 'dark'

const PAGES: Record<string, () => ReactElement> = {
  '/':          () => <Landing theme={theme} toggleTheme={noop} />,
  '/signup':    () => <SignUp />,
  '/about':     () => <About theme={theme} toggleTheme={noop} />,
  '/careers':   () => <Careers theme={theme} toggleTheme={noop} />,
  '/customers': () => <Customers theme={theme} toggleTheme={noop} />,
  '/press':     () => <Press theme={theme} toggleTheme={noop} />,
  '/contact':   () => <Contact theme={theme} toggleTheme={noop} />,
  '/refund':    () => <Refund theme={theme} toggleTheme={noop} />,
  '/privacy':   () => <Privacy theme={theme} toggleTheme={noop} />,
  '/terms':     () => <Terms theme={theme} toggleTheme={noop} />,
  '/security':  () => <Security theme={theme} toggleTheme={noop} />,
  '/dpa':       () => <Dpa theme={theme} toggleTheme={noop} />,
  '/cookies':   () => <Cookies theme={theme} toggleTheme={noop} />,
}

export function render(path: string): string {
  const Page = PAGES[path]
  if (!Page) throw new Error(`No prerender page registered for ${path}`)
  return renderToString(
    <StaticRouter location={path}>
      <AuthProvider>
        <Page />
      </AuthProvider>
    </StaticRouter>,
  )
}

/** Structured data for the home page: what the product is, what it costs, and the FAQ. */
export function homeJsonLd() {
  const offer = (name: string, price: string) => ({ '@type': 'Offer', name, price, priceCurrency: 'INR', availability: 'https://schema.org/InStock' })
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: 'AI-powered job application platform: tailored resumes, ATS scoring, cover letters, recruiter outreach and an application tracker.',
      offers: [
        offer('Free', '0'),
        offer('Pro — 1 month', '199'),
        offer('Pro — 3 months', '449'),
        offer('Pro — 1 year', '1188'),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]
}
