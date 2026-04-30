import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface Job {
  id: number
  role: string
  company: string
  loc: string
  match: number
  desc: string
  tags: string[]
  salary: string
  period: string
  color: string
  domain: string
  linkedinSlug: string
  requirements: string[]
  type: string
  portals: ('linkedin' | 'indeed' | 'naukri')[]
}

const INDIA_JOBS: Job[] = [
  { id: 1,  role: 'Senior Product Manager',       company: 'Swiggy',          loc: 'Bangalore',  match: 96, type: 'Full-time',  color: '#FC8019', domain: 'swiggy.com',         linkedinSlug: 'swiggy',                       portals: ['linkedin','indeed','naukri'],  salary: '₹40–₹60 LPA', period: 'per year', tags: ['Product Strategy','Growth','Data-Driven'],      desc: 'Lead product strategy for Swiggy\'s core ordering experience. Drive 0-to-1 features serving 90M+ users.', requirements: ['5+ years PM experience','SQL and data analysis','A/B testing expertise','Stakeholder management','Consumer internet background'] },
  { id: 2,  role: 'UX Design Lead',               company: 'Flipkart',         loc: 'Bangalore',  match: 91, type: 'Full-time',  color: '#2874F0', domain: 'flipkart.com',        linkedinSlug: 'flipkart',                     portals: ['linkedin','indeed','naukri'],  salary: '₹35–₹55 LPA', period: 'per year', tags: ['Design Systems','Mobile','Figma'],               desc: 'Define the design language for Flipkart\'s next-gen mobile commerce. Lead a team of 8 designers.', requirements: ['7+ years UX experience','End-to-end portfolio','Design team leadership','Figma proficiency','Mobile-first mindset'] },
  { id: 3,  role: 'Product Designer',             company: 'Zomato',           loc: 'Gurugram',   match: 88, type: 'Full-time',  color: '#E23744', domain: 'zomato.com',          linkedinSlug: 'zomato',                       portals: ['linkedin','indeed','naukri'],  salary: '₹25–₹40 LPA', period: 'per year', tags: ['User Research','Figma','A/B Testing'],           desc: 'Shape the food discovery experience used by 20M+ daily active users across India and the Middle East.', requirements: ['3+ years product design','Consumer app portfolio','User research skills','Figma proficiency','Data-informed approach'] },
  { id: 4,  role: 'Senior Consultant',            company: 'Infosys',          loc: 'Pune',       match: 85, type: 'Full-time',  color: '#007CC3', domain: 'infosys.com',         linkedinSlug: 'infosys',                      portals: ['linkedin','indeed','naukri'],  salary: '₹20–₹35 LPA', period: 'per year', tags: ['Consulting','Digital Transformation','Agile'],  desc: 'Drive digital transformation for Fortune 500 clients. Lead cross-functional teams and manage stakeholders.', requirements: ['4+ years consulting','Digital transformation track record','Client-facing communication','Agile/Scrum certified','MBA preferred'] },
  { id: 5,  role: 'Data Scientist',               company: 'Meesho',           loc: 'Bangalore',  match: 82, type: 'Full-time',  color: '#570DF8', domain: 'meesho.com',          linkedinSlug: 'meesho',                       portals: ['linkedin','indeed','naukri'],  salary: '₹30–₹50 LPA', period: 'per year', tags: ['Python','ML','Recommendation Systems'],         desc: 'Build ML models for personalised recommendations and demand forecasting for India\'s fastest-growing social commerce.', requirements: ['3+ years data science','Python/SQL/statistics','Recommendation systems','PyTorch or TensorFlow','Large-scale pipelines'] },
  { id: 6,  role: 'Engineering Manager',          company: 'CRED',             loc: 'Bangalore',  match: 79, type: 'Full-time',  color: '#1C1C1C', domain: 'cred.club',           linkedinSlug: 'cred-club',                    portals: ['linkedin','indeed','naukri'],  salary: '₹50–₹80 LPA', period: 'per year', tags: ['Leadership','Backend','FinTech'],                desc: 'Lead a team of 10 engineers on CRED\'s credit management and rewards platform serving premium credit card users.', requirements: ['5+ years engineering','2+ years leadership','High-scale backend systems','Hiring and mentoring track record','Fintech a plus'] },
  { id: 7,  role: 'Business Analyst',             company: 'TCS',              loc: 'Mumbai',     match: 77, type: 'Full-time',  color: '#00A0D2', domain: 'tcs.com',             linkedinSlug: 'tata-consultancy-services',    portals: ['linkedin','indeed','naukri'],  salary: '₹12–₹22 LPA', period: 'per year', tags: ['SQL','JIRA','Stakeholder Management'],           desc: 'Translate business requirements into technical specs for large-scale enterprise transformation across BFSI.', requirements: ['2+ years as BA','BFSI domain experience','SQL proficiency','Requirements documentation','JIRA/Confluence skills'] },
  { id: 8,  role: 'Growth Product Manager',       company: 'PhonePe',          loc: 'Bangalore',  match: 84, type: 'Full-time',  color: '#5F259F', domain: 'phonepe.com',         linkedinSlug: 'phonepe',                      portals: ['linkedin','indeed','naukri'],  salary: '₹35–₹55 LPA', period: 'per year', tags: ['Growth','Analytics','FinTech'],                  desc: 'Own the growth funnel for PhonePe\'s insurance and mutual funds vertical. Drive acquisition, activation, and retention.', requirements: ['4+ years PM experience','Growth/PLG track record','SQL/Python skills','Fintech experience','Data-driven decisions'] },
  { id: 9,  role: 'Backend Engineer',             company: 'Razorpay',         loc: 'Bangalore',  match: 81, type: 'Full-time',  color: '#2EB5C9', domain: 'razorpay.com',        linkedinSlug: 'razorpay',                     portals: ['linkedin','indeed','naukri'],  salary: '₹28–₹45 LPA', period: 'per year', tags: ['Java','Microservices','Payments'],               desc: 'Build and scale high-throughput payment processing systems serving 8M+ Indian businesses.', requirements: ['3+ years backend engineering','Java or Go expertise','Microservices architecture','Payments domain understanding','High-availability systems'] },
  { id: 10, role: 'Product Manager',              company: 'Ola',              loc: 'Bangalore',  match: 80, type: 'Full-time',  color: '#F5A623', domain: 'olacabs.com',         linkedinSlug: 'ani-technologies',             portals: ['linkedin','indeed','naukri'],  salary: '₹22–₹38 LPA', period: 'per year', tags: ['Mobility','Product Strategy','Operations'],     desc: 'Drive product for Ola\'s driver-partner and consumer experience across India\'s largest mobility platform.', requirements: ['3+ years PM experience','Marketplace or mobility background','Data analysis skills','Cross-functional collaboration','Structured problem solving'] },
  { id: 11, role: 'ML Engineer',                  company: 'Google India',     loc: 'Hyderabad',  match: 89, type: 'Full-time',  color: '#4285F4', domain: 'google.com',          linkedinSlug: 'google',                       portals: ['linkedin','indeed'],           salary: '₹60–₹120 LPA',period: 'per year', tags: ['TensorFlow','Python','Large-Scale ML'],         desc: 'Build and deploy large-scale machine learning models powering Google Search, Maps, and Assistant in India.', requirements: ['4+ years ML engineering','TensorFlow/JAX expertise','ML system design','Research background preferred','Publications a plus'] },
  { id: 12, role: 'Software Development Engineer',company: 'Amazon India',     loc: 'Bangalore',  match: 86, type: 'Full-time',  color: '#FF9900', domain: 'amazon.in',           linkedinSlug: 'amazon',                       portals: ['linkedin','indeed'],           salary: '₹45–₹90 LPA', period: 'per year', tags: ['Java','Distributed Systems','AWS'],             desc: 'Design and build highly scalable systems that power Amazon\'s India marketplace serving 300M+ customers.', requirements: ['3+ years SDE experience','Java or Python expertise','System design proficiency','AWS knowledge','OOP and data structures'] },
  { id: 13, role: 'Finance Analyst',              company: 'Paytm',            loc: 'Noida',      match: 74, type: 'Full-time',  color: '#00BAF2', domain: 'paytm.com',           linkedinSlug: 'one97-communications-paytm',   portals: ['linkedin','indeed','naukri'],  salary: '₹10–₹18 LPA', period: 'per year', tags: ['Excel','Financial Modelling','Reporting'],     desc: 'Prepare financial reports, budgets, and forecasts for Paytm\'s financial services business units.', requirements: ['2+ years finance experience','Financial modelling skills','Advanced Excel/SQL','Fintech understanding','CA/MBA Finance preferred'] },
  { id: 14, role: 'Full Stack Developer',         company: 'Groww',            loc: 'Bangalore',  match: 83, type: 'Full-time',  color: '#5367FF', domain: 'groww.in',            linkedinSlug: 'groww',                        portals: ['linkedin','indeed','naukri'],  salary: '₹25–₹45 LPA', period: 'per year', tags: ['React','Node.js','TypeScript'],                 desc: 'Build the next generation of wealth management features for Groww\'s 15M+ active investors.', requirements: ['3+ years full-stack experience','React and Node.js proficiency','TypeScript expertise','REST API design','Fintech or consumer product background'] },
  { id: 15, role: 'DevOps Engineer',              company: 'Wipro',            loc: 'Hyderabad',  match: 72, type: 'Full-time',  color: '#341C6A', domain: 'wipro.com',           linkedinSlug: 'wipro',                        portals: ['linkedin','indeed','naukri'],  salary: '₹12–₹22 LPA', period: 'per year', tags: ['Kubernetes','CI/CD','Terraform'],                desc: 'Design and maintain CI/CD pipelines and cloud infrastructure for large enterprise clients across banking and retail.', requirements: ['3+ years DevOps experience','Kubernetes and Docker expertise','Terraform/IaC proficiency','CI/CD pipeline experience','AWS or Azure certified'] },
  { id: 16, role: 'Data Engineer',                company: 'Myntra',           loc: 'Bangalore',  match: 80, type: 'Full-time',  color: '#FF3F6C', domain: 'myntra.com',          linkedinSlug: 'myntra',                       portals: ['linkedin','indeed','naukri'],  salary: '₹22–₹40 LPA', period: 'per year', tags: ['Spark','Airflow','BigQuery'],                   desc: 'Build and maintain Myntra\'s data platform powering personalisation, inventory forecasting, and analytics.', requirements: ['3+ years data engineering','Spark and Airflow expertise','SQL and Python proficiency','Data warehouse design','E-commerce data background a plus'] },
  { id: 17, role: 'Product Manager',              company: 'Nykaa',            loc: 'Mumbai',     match: 78, type: 'Full-time',  color: '#FC2779', domain: 'nykaa.com',           linkedinSlug: 'nykaa',                        portals: ['linkedin','indeed','naukri'],  salary: '₹20–₹35 LPA', period: 'per year', tags: ['E-commerce','Product Strategy','Analytics'],   desc: 'Own the product roadmap for Nykaa\'s beauty and fashion vertical serving 30M+ customers.', requirements: ['3+ years PM experience','E-commerce background preferred','Data-driven product decisions','Stakeholder alignment','Customer empathy'] },
  { id: 18, role: 'Operations Manager',           company: 'Urban Company',    loc: 'Gurugram',   match: 75, type: 'Full-time',  color: '#5e4ce6', domain: 'urbancompany.com',    linkedinSlug: 'urban-company',                portals: ['linkedin','indeed','naukri'],  salary: '₹15–₹28 LPA', period: 'per year', tags: ['Operations','Process Improvement','Leadership'],desc: 'Lead city operations for Urban Company\'s home services platform, managing quality, supply, and demand.', requirements: ['3+ years operations management','Process improvement experience','Data analysis skills','Team leadership','Operations or consulting background'] },
  { id: 19, role: 'Frontend Engineer',            company: 'Zepto',            loc: 'Mumbai',     match: 76, type: 'Full-time',  color: '#A020F0', domain: 'zeptonow.com',        linkedinSlug: 'zepto-app',                    portals: ['linkedin','naukri'],          salary: '₹20–₹38 LPA', period: 'per year', tags: ['React','Performance','TypeScript'],             desc: 'Build the sub-10-minute grocery delivery experience for Zepto\'s rapidly growing consumer app.', requirements: ['2+ years frontend experience','React and TypeScript expertise','Performance optimization skills','Consumer app experience','Mobile web proficiency'] },
  { id: 20, role: 'Product Marketing Manager',    company: 'MakeMyTrip',       loc: 'Gurugram',   match: 73, type: 'Full-time',  color: '#E40045', domain: 'makemytrip.com',      linkedinSlug: 'makemytrip',                   portals: ['linkedin','indeed','naukri'],  salary: '₹18–₹32 LPA', period: 'per year', tags: ['GTM','Marketing Analytics','Brand'],            desc: 'Drive go-to-market strategy and campaigns for MakeMyTrip\'s hotel and holiday packages vertical.', requirements: ['3+ years product marketing','B2C campaign management','Marketing analytics proficiency','Travel industry a plus','Brand storytelling skills'] },
  { id: 21, role: 'Senior Software Engineer',     company: 'Atlassian',        loc: 'Bangalore',  match: 88, type: 'Full-time',  color: '#0052CC', domain: 'atlassian.com',       linkedinSlug: 'atlassian',                    portals: ['linkedin','indeed'],          salary: '₹50–₹95 LPA', period: 'per year', tags: ['Java','Distributed Systems','Cloud'],           desc: 'Build developer tools used by millions of teams worldwide at Atlassian\'s India engineering hub.', requirements: ['5+ years software engineering','Java or Python expertise','Distributed systems knowledge','Collaborative remote work style','OSS contributions a plus'] },
  { id: 22, role: 'Product Manager – Ads',        company: 'ShareChat',        loc: 'Bangalore',  match: 79, type: 'Full-time',  color: '#0FAAD0', domain: 'sharechat.com',       linkedinSlug: 'sharechat',                    portals: ['linkedin','indeed','naukri'],  salary: '₹30–₹50 LPA', period: 'per year', tags: ['Ads Tech','Monetisation','Analytics'],          desc: 'Own ShareChat\'s ads monetisation product across vernacular social media reaching 400M+ Indian users.', requirements: ['3+ years PM experience','Ads or monetisation background','Data-driven mindset','Understanding of Indian internet users','SQL proficiency'] },
  { id: 23, role: 'Consultant – Strategy',        company: 'Deloitte India',   loc: 'Mumbai',     match: 83, type: 'Full-time',  color: '#86BC25', domain: 'deloitte.com',        linkedinSlug: 'deloitte',                     portals: ['linkedin','indeed','naukri'],  salary: '₹18–₹32 LPA', period: 'per year', tags: ['Strategy','Business Consulting','BFSI'],        desc: 'Deliver strategy and operations consulting for leading BFSI and technology clients across India and SEA.', requirements: ['2+ years consulting experience','MBA or equivalent','Structured problem solving','Excellent presentation skills','BFSI domain a plus'] },
  { id: 24, role: 'Machine Learning Engineer',    company: 'Freshworks',       loc: 'Chennai',    match: 81, type: 'Full-time',  color: '#f5871f', domain: 'freshworks.com',      linkedinSlug: 'freshworks',                   portals: ['linkedin','indeed','naukri'],  salary: '₹28–₹50 LPA', period: 'per year', tags: ['NLP','Python','SaaS'],                          desc: 'Build AI-powered features for Freshworks\' CRM and support products used by 60,000+ businesses globally.', requirements: ['3+ years ML engineering','NLP and LLM experience','Python expertise','SaaS product understanding','API design skills'] },
]

const GLOBAL_JOBS: Job[] = [
  { id: 1, role: 'Senior Product Architect',    company: 'Stellar Systems',  loc: 'Remote',         match: 98, type: 'Remote · Full-time', color: '#1e293b', domain: 'stellar.io',      linkedinSlug: 'stellar-development-foundation', portals: ['linkedin','indeed'], salary: '$180k–$220k', period: 'USD/yr', tags: ['Distributed Systems','Kubernetes','Leadership'], desc: 'Lead core architecture of next-gen cloud infrastructure at a fast-growing systems company.', requirements: ['8+ years software architecture','Distributed systems expertise','Platform/infra team leadership','Kubernetes proficiency','Async communication skills'] },
  { id: 2, role: 'Lead UX Strategist',          company: 'Nexus Finance',    loc: 'New York, NY',   match: 89, type: 'Full-time',           color: '#0f172a', domain: 'nexus.io',        linkedinSlug: 'nexus-mutual',                   portals: ['linkedin','indeed'], salary: '$165k–$190k', period: 'USD/yr', tags: ['Design Systems','FinTech','Research'],           desc: 'Define the editorial design system for a global FinTech expansion targeting enterprise customers.', requirements: ['7+ years UX leadership','Global design systems experience','Fintech background','Engineering collaboration','Measurable design impact'] },
  { id: 3, role: 'Principal Product Designer',  company: 'Vercel',           loc: 'Remote',         match: 94, type: 'Remote · Full-time', color: '#000000', domain: 'vercel.com',       linkedinSlug: 'vercel',                         portals: ['linkedin','indeed'], salary: '$170k–$200k', period: 'USD/yr', tags: ['Developer Tools','Figma','DX'],                  desc: 'Shape the future of developer experience. Lead design for core platform features used by millions.', requirements: ['6+ years product design','Developer tools passion','Deep Figma expertise','Complex SaaS features','Async communication'] },
  { id: 4, role: 'Design System Lead',          company: 'Stripe',           loc: 'San Francisco',  match: 91, type: 'Full-time',           color: '#635bff', domain: 'stripe.com',       linkedinSlug: 'stripe',                         portals: ['linkedin','indeed'], salary: '$190k–$230k', period: 'USD/yr', tags: ['Design Systems','React','Accessibility'],        desc: 'Build and scale the design foundation for Stripe\'s global product suite.', requirements: ['7+ years design/frontend','Design system expertise','React and a11y skills','Cross-functional leadership','Quality obsession'] },
  { id: 5, role: 'Senior Product Manager',      company: 'Notion',           loc: 'Remote',         match: 87, type: 'Remote · Full-time', color: '#000000', domain: 'notion.so',        linkedinSlug: 'notionhq',                       portals: ['linkedin','indeed'], salary: '$160k–$195k', period: 'USD/yr', tags: ['Productivity','PLG','B2B SaaS'],                 desc: 'Drive product strategy for Notion\'s collaborative workspace tools used by 30M+ users globally.', requirements: ['5+ years PM experience','PLG expertise','B2B SaaS background','Strong writing skills','Async-first work style'] },
  { id: 6, role: 'Product Manager',             company: 'Figma',            loc: 'San Francisco',  match: 90, type: 'Full-time',           color: '#F24E1E', domain: 'figma.com',        linkedinSlug: 'figma',                          portals: ['linkedin','indeed'], salary: '$175k–$210k', period: 'USD/yr', tags: ['Design Tools','Platform','Developer API'],       desc: 'Lead product for Figma\'s developer-facing platform and plugin ecosystem used by 8M+ designers.', requirements: ['4+ years PM experience','Design tool or dev tool background','API product experience','Strong cross-functional collaboration','Data-driven approach'] },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function detectCountry(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (tz.includes('Kolkata') || tz.includes('Calcutta')) return 'IN'
  return navigator.language === 'en-IN' ? 'IN' : 'GLOBAL'
}
function matchColor(pct: number) {
  if (pct >= 90) return '#10B981'
  if (pct >= 80) return '#F59E0B'
  return '#6B7280'
}
function toSlug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

function getPortalUrl(key: string, job: Job, isIndia: boolean) {
  const roleQ   = encodeURIComponent(job.role)
  const combined = encodeURIComponent(`${job.role} ${job.company}`)
  const citySlug = toSlug(job.loc.split(',')[0].trim())
  const cityEnc  = encodeURIComponent(job.loc.split(',')[0].trim())
  if (key === 'linkedin') return `https://www.linkedin.com/company/${job.linkedinSlug}/jobs/?keywords=${roleQ}`
  if (key === 'indeed')   return isIndia ? `https://in.indeed.com/jobs?q=${combined}&l=${cityEnc}` : `https://www.indeed.com/jobs?q=${combined}&l=${encodeURIComponent(job.loc)}`
  if (key === 'naukri')   return `https://www.naukri.com/${toSlug(job.role)}-${toSlug(job.company)}-jobs-in-${citySlug}`
  return '#'
}

// ── Company Logo (Clearbit with fallback) ─────────────────────────────────────
function CompanyLogo({ domain, company, color, size = 36 }: { domain: string; company: string; color: string; size?: number }) {
  const [err, setErr] = useState(false)
  const r = size * 0.25
  if (err) {
    return <div style={{ width: size, height: size, borderRadius: r, background: color, flexShrink: 0, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.44 }}>{company[0].toUpperCase()}</div>
  }
  return (
    <div style={{ width: size, height: size, borderRadius: r, background: '#fff', border: '1px solid #e5eaf5', flexShrink: 0, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <img src={`https://logo.clearbit.com/${domain}`} alt={company} width={size - 10} height={size - 10} style={{ objectFit: 'contain' }} onError={() => setErr(true)} />
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcoClose = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)
const IcoCheck = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoExternal = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)
const IcoSearch = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)

const PORTAL_META = {
  linkedin: { name: 'LinkedIn',  color: '#0A66C2', bg: '#EFF6FF', desc: 'Company\'s jobs page',     icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="#0A66C2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
  indeed:   { name: 'Indeed',    color: '#003A9B', bg: '#EFF3FF', desc: 'Millions of live listings', icon: <svg width={20} height={20} viewBox="0 0 36 36"><rect width="36" height="36" rx="7" fill="#003A9B"/><text x="8" y="26" fontSize="20" fontWeight="bold" fill="white" fontFamily="Arial">i</text></svg> },
  naukri:   { name: 'Naukri',    color: '#FF7555', bg: '#FFF4F0', desc: 'India\'s #1 job portal',   icon: <svg width={20} height={20} viewBox="0 0 36 36"><rect width="36" height="36" rx="7" fill="#FF7555"/><text x="5" y="26" fontSize="19" fontWeight="bold" fill="white" fontFamily="Arial">N</text></svg> },
} as const

const FILTERS = ['All Opportunities', 'Remote Only', 'Best Match', 'Latest']
const INDIA_CITIES = ['All Locations', 'Bangalore', 'Mumbai', 'Gurugram', 'Pune', 'Hyderabad', 'Noida', 'Chennai']

export default function JobMatch() {
  const { user } = useAuth()
  const [country]      = useState(() => detectCountry())
  const [activeFilter, setActiveFilter] = useState('All Opportunities')
  const [cityFilter,   setCityFilter]   = useState('All Locations')
  const [roleSearch,   setRoleSearch]   = useState('')
  const [companySearch,setCompanySearch] = useState('')
  const [detailJob,    setDetailJob]    = useState<Job | null>(null)
  const [applyJob,     setApplyJob]     = useState<Job | null>(null)

  const isIndia  = country === 'IN'
  const allJobs  = isIndia ? INDIA_JOBS : GLOBAL_JOBS

  const relevantJobs = [...allJobs].sort((a, b) => {
    const title = (user?.jobTitle ?? '').toLowerCase()
    const aM = a.role.toLowerCase().includes(title) || a.tags.some(t => t.toLowerCase().includes(title))
    const bM = b.role.toLowerCase().includes(title) || b.tags.some(t => t.toLowerCase().includes(title))
    if (aM && !bM) return -1
    if (!aM && bM) return 1
    return b.match - a.match
  })

  const filtered = relevantJobs.filter(j => {
    if (activeFilter === 'Remote Only' && !j.loc.toLowerCase().includes('remote')) return false
    if (activeFilter === 'Best Match'  && j.match < 85) return false
    if (isIndia && cityFilter !== 'All Locations' && !j.loc.toLowerCase().includes(cityFilter.toLowerCase())) return false
    if (roleSearch    && !j.role.toLowerCase().includes(roleSearch.toLowerCase()))       return false
    if (companySearch && !j.company.toLowerCase().includes(companySearch.toLowerCase())) return false
    return true
  })

  const highMatches = allJobs.filter(j => j.match >= 85).length
  const avgMatch    = Math.round(allJobs.reduce((s, j) => s + j.match, 0) / allJobs.length)

  const openPortal = (key: string, job: Job) => {
    window.open(getPortalUrl(key, job, isIndia), '_blank')
  }

  return (
    <>
      {/* Header */}
      <div className="jm-header">
        <h1>Architected for <em>Success.</em></h1>
        <p>{isIndia ? `AI-matched roles across India's top tech companies, tailored for ${user?.jobTitle ?? 'your profile'}.` : `AI engine matched your profile against 42,000+ active listings worldwide.`}</p>
        <div className="jm-header-stats">
          <div className="jm-stat-pill"><div className="jm-num">{highMatches}</div><div className="jm-lbl">HIGH MATCHES</div></div>
          <div className="jm-stat-pill"><div className="jm-num">{avgMatch}%</div><div className="jm-lbl">PROFILE FIT</div></div>
          <div className="jm-stat-pill"><div className="jm-num">{allJobs.length}</div><div className="jm-lbl">TOTAL ROLES</div></div>
          {isIndia && <div className="jm-stat-pill"><div className="jm-num">🇮🇳</div><div className="jm-lbl">INDIA JOBS</div></div>}
        </div>
      </div>

      {/* Filter bar */}
      <div className="jm-filter-bar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, minWidth: 0 }}>
          {FILTERS.map(f => (
            <button key={f} className={`jm-filter-btn${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
          {isIndia && (
            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="jm-filter-btn"
              style={{ borderColor: cityFilter !== 'All Locations' ? 'var(--border-strong)' : 'transparent', paddingRight: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
              {INDIA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        {/* Separate search boxes */}
        <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
          <div className="jm-search">
            <IcoSearch />
            <input placeholder="Search by role…" value={roleSearch} onChange={e => setRoleSearch(e.target.value)} style={{ width: 140 }} />
            {roleSearch && <button onClick={() => setRoleSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-mute)', cursor: 'pointer', padding: 0, display: 'flex' }}><IcoClose /></button>}
          </div>
          <div className="jm-search">
            <IcoSearch />
            <input placeholder="Search by company…" value={companySearch} onChange={e => setCompanySearch(e.target.value)} style={{ width: 150 }} />
            {companySearch && <button onClick={() => setCompanySearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-mute)', cursor: 'pointer', padding: 0, display: 'flex' }}><IcoClose /></button>}
          </div>
        </div>
      </div>

      {/* Notices */}
      {isIndia && (
        <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-200)', borderRadius: 8, padding: '9px 14px', marginBottom: 10, fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          📍 Showing jobs in <b>India</b> based on your location. Salaries shown in LPA (Lakhs Per Annum).
        </div>
      )}
      <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', marginBottom: 18, fontSize: 12, color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 6 }}>
        ℹ️ AI-curated sample roles. <b>Quick Apply</b> opens real listings on the portals available for each job — only showing portals that carry that role.
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginBottom: 12 }}>
        Showing <b style={{ color: 'var(--text)' }}>{filtered.length}</b> of {allJobs.length} roles
        {(roleSearch || companySearch) && <button onClick={() => { setRoleSearch(''); setCompanySearch('') }} style={{ marginLeft: 10, fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Clear filters ×</button>}
      </div>

      {/* Job grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-mute)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          No roles match your search. Try adjusting the filters or search terms.
        </div>
      ) : (
        <div className="jm-grid">
          {filtered.map(job => (
            <div key={job.id} className="job-card">
              <div className="match-badge" style={{ background: `${matchColor(job.match)}20`, color: matchColor(job.match), border: `1px solid ${matchColor(job.match)}40` }}>
                {job.match}% Match
              </div>
              <div className="jc-head">
                <CompanyLogo domain={job.domain} company={job.company} color={job.color} size={36} />
                <div>
                  <div className="jc-role">{job.role}</div>
                  <div className="jc-co">{job.company} · {job.loc}</div>
                </div>
              </div>
              <div className="jc-desc">{job.desc}</div>
              <div className="jc-tags">{job.tags.map(t => <span key={t} className="jc-tag">{t}</span>)}</div>
              {/* Available portals row */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                {job.portals.map(p => (
                  <span key={p} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: PORTAL_META[p].bg, color: PORTAL_META[p].color, border: `1px solid ${PORTAL_META[p].color}30` }}>
                    {PORTAL_META[p].name}
                  </span>
                ))}
              </div>
              <div className="jc-footer">
                <div className="jc-salary">{job.salary} <span>{job.period}</span></div>
                <div className="jc-actions">
                  <button className="btn-jc-secondary" onClick={() => setDetailJob(job)}>Details</button>
                  <button className="btn-jc-primary" onClick={() => setApplyJob(job)}>Quick Apply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Panel ─────────────────────────────────────── */}
      {detailJob && (
        <>
          <div className="jm-detail-backdrop" onClick={() => setDetailJob(null)} />
          <div className="jm-detail-panel">
            <div className="jm-detail-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CompanyLogo domain={detailJob.domain} company={detailJob.company} color={detailJob.color} size={40} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>{detailJob.role}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginTop: 2 }}>{detailJob.company} · {detailJob.loc}</div>
                </div>
              </div>
              <button className="jm-detail-close" onClick={() => setDetailJob(null)}><IcoClose /></button>
            </div>
            <div className="jm-detail-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ background: `${matchColor(detailJob.match)}18`, color: matchColor(detailJob.match), border: `1px solid ${matchColor(detailJob.match)}40`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{detailJob.match}% Match</span>
                <span style={{ fontSize: 12, color: 'var(--text-mute)', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px' }}>{detailJob.type}</span>
              </div>
              <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 4 }}>COMPENSATION</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{detailJob.salary}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>{detailJob.period}</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 8 }}>ABOUT THIS ROLE</div>
                <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.65, margin: 0 }}>{detailJob.desc}</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 10 }}>REQUIREMENTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {detailJob.requirements.map((req, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--blue-50)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}><IcoCheck /></span>
                      <span style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.5 }}>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 8 }}>KEY SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{detailJob.tags.map(t => <span key={t} className="jc-tag">{t}</span>)}</div>
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 10 }}>APPLY VIA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {detailJob.portals.map(p => {
                  const m = PORTAL_META[p]
                  return (
                    <button key={p} onClick={() => openPortal(p, detailJob)} className="jm-portal-btn"
                      style={{ '--portal-color': m.color, '--portal-bg': m.bg } as React.CSSProperties}>
                      <span className="jm-portal-icon">{m.icon}</span>
                      <span className="jm-portal-info"><span className="jm-portal-name">{m.name}</span><span className="jm-portal-desc">{m.desc}</span></span>
                      <IcoExternal size={13} />
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setDetailJob(null)} style={{ width: '100%', height: 38, borderRadius: 9, background: 'none', color: 'var(--text-mute)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* ── Apply Portal Modal ────────────────────────────────── */}
      {applyJob && (
        <div className="jm-apply-backdrop" onClick={() => setApplyJob(null)}>
          <div className="jm-apply-modal" onClick={e => e.stopPropagation()}>
            <div className="jm-apply-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CompanyLogo domain={applyJob.domain} company={applyJob.company} color={applyJob.color} size={36} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>{applyJob.role}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>{applyJob.company} · {applyJob.loc}</div>
                </div>
              </div>
              <button className="jm-detail-close" onClick={() => setApplyJob(null)}><IcoClose /></button>
            </div>
            <div style={{ padding: '14px 18px 18px' }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginBottom: 14 }}>
                Available on <b>{applyJob.portals.length}</b> portal{applyJob.portals.length > 1 ? 's' : ''} — choose where to apply:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {applyJob.portals.map(p => {
                  const m = PORTAL_META[p]
                  return (
                    <button key={p} onClick={() => { openPortal(p, applyJob); setApplyJob(null) }} className="jm-portal-btn jm-portal-btn-lg"
                      style={{ '--portal-color': m.color, '--portal-bg': m.bg } as React.CSSProperties}>
                      <span className="jm-portal-icon">{m.icon}</span>
                      <span className="jm-portal-info"><span className="jm-portal-name">{m.name}</span><span className="jm-portal-desc">{m.desc}</span></span>
                      <IcoExternal size={13} />
                    </button>
                  )
                })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
                Opens the company's page or a filtered job search for this role.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
