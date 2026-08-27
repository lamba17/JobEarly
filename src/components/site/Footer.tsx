import { Link } from 'react-router-dom'
import { IconRocket } from '../../icons'

const PRODUCT_LINKS: [string, string][] = [
  ['Resume Builder', '/#feature-resume'],
  ['ATS Score', '/#feature-ats'],
  ['Cover Letters', '/#feature-cover-letters'],
  ['Smart Outreach', '/#feature-outreach'],
]
const COMPANY_LINKS: [string, string][] = [
  ['About', '/about'],
  ['Careers', '/careers'],
  ['Customers', '/customers'],
  ['Press', '/press'],
  ['Contact', '/contact'],
]
const LEGAL_LINKS: [string, string][] = [
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
  ['Security', '/security'],
  ['DPA', '/dpa'],
  ['Cookies', '/cookies'],
]

export default function Footer() {
  const cols: { h: string; links: [string, string][] }[] = [
    { h: 'Product', links: PRODUCT_LINKS },
    { h: 'Company', links: COMPANY_LINKS },
    { h: 'Legal',   links: LEGAL_LINKS },
  ]
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand">
              <span className="brand-mark"><IconRocket size={16} stroke={2.4} /></span>
              <span>JobEarly</span>
            </Link>
            <p className="desc">AI-powered job application platform. Get hired before everyone else.</p>
          </div>
          {cols.map(({ h, links }) => (
            <div key={h} className="footer-col">
              <h5>{h}</h5>
              <ul>{links.map(([l, href]) => (
                <li key={l}>{href.startsWith('/#') ? <a href={href}>{l}</a> : <Link to={href}>{l}</Link>}</li>
              ))}</ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <div>© 2026 JobEarly, Inc. — Made for people who don't wait.</div>
          <div className="legal"><Link to="/sitemap">Sitemap</Link></div>
        </div>
      </div>
    </footer>
  )
}
