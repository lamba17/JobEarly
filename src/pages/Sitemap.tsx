import { Link } from 'react-router-dom'
import StaticPage from '../components/site/StaticPage'

const GROUPS: { h: string; links: [string, string][] }[] = [
  { h: 'Product', links: [
    ['Home', '/'],
    ['Features', '/#features'],
    ['How it works', '/#how'],
    ['Pricing', '/#pricing'],
    ['FAQ', '/#faq'],
  ] },
  { h: 'Account', links: [
    ['Sign in', '/signin'],
    ['Sign up', '/signup'],
    ['Forgot password', '/forgot-password'],
  ] },
  { h: 'Company', links: [
    ['About', '/about'],
    ['Careers', '/careers'],
    ['Customers', '/customers'],
    ['Press', '/press'],
    ['Contact', '/contact'],
  ] },
  { h: 'Legal', links: [
    ['Privacy', '/privacy'],
    ['Terms', '/terms'],
    ['Security', '/security'],
    ['DPA', '/dpa'],
    ['Cookies', '/cookies'],
  ] },
]

export default function Sitemap({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <StaticPage theme={theme} toggleTheme={toggleTheme} eyebrow="Site" title="Sitemap">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
        {GROUPS.map(g => (
          <div key={g.h}>
            <h2 style={{ marginTop: 0 }}>{g.h}</h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
              {g.links.map(([l, href]) => (
                <li key={l}>{href.startsWith('/#') ? <a href={href}>{l}</a> : <Link to={href}>{l}</Link>}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </StaticPage>
  )
}
