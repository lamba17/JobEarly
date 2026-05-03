import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import * as pdfjs from 'pdfjs-dist'
import mammoth from 'mammoth'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'pdf') {
    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise
    let text = ''
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      // Preserve line breaks by tracking Y position
      let lastY: number | null = null
      for (const item of content.items as any[]) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 3) text += '\n'
        text += item.str
        lastY = item.transform[5]
      }
      text += '\n'
    }
    return text
  }

  if (ext === 'docx' || ext === 'doc') {
    const buf = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buf })
    return result.value
  }

  if (ext === 'txt') {
    return file.text()
  }

  throw new Error(`Unsupported file type: .${ext}. Please upload a PDF, DOCX, or TXT file.`)
}
import { useAuth } from '../../context/AuthContext'
import { addResume } from '../../lib/userStore'
import {
  IconSparkle, IconUser, IconDoc, IconUndo, IconRedo,
  IconDownload, IconShare, IconCustomize, IconZoomIn, IconZoomOut,
  IconBriefcase, IconCheck, IconPlus,
} from '../../icons'

// ── Local icon helpers ────────────────────────────────────────────────────────

const IcoX = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)
const IcoChevDown = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const IcoTarget = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IcoWarn = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
)
const IcoLink2 = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const IcoLightning = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)
const IcoEditPen = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcoPrint = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/>
    <rect x="6" y="14" width="12" height="8" rx="1"/>
  </svg>
)
const IcoMail = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

// ── Constants ─────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'editorial', name: 'Editorial Pro',    headerBg: '#0f172a' },
  { id: 'navy',      name: 'Navy Executive',   headerBg: '#1e3a8a' },
  { id: 'charcoal',  name: 'Charcoal Modern',  headerBg: '#374151' },
  { id: 'forest',    name: 'Forest',           headerBg: '#064e3b' },
  { id: 'burgundy',  name: 'Burgundy',         headerBg: '#7f1d1d' },
  { id: 'slate',     name: 'Slate',            headerBg: '#334155' },
]

const ACCENT_COLORS = [
  { label: 'Blue',   value: '#2563EB' },
  { label: 'Indigo', value: '#4F46E5' },
  { label: 'Violet', value: '#7C3AED' },
  { label: 'Teal',   value: '#0D9488' },
  { label: 'Green',  value: '#16A34A' },
  { label: 'Rose',   value: '#E11D48' },
]

const FONT_OPTIONS = [
  { id: 'georgia',   name: 'Georgia',    family: 'Georgia, serif' },
  { id: 'helvetica', name: 'Helvetica',  family: "'Helvetica Neue', Arial, sans-serif" },
  { id: 'times',     name: 'Times New Roman', family: "'Times New Roman', serif" },
]

// ── ATS logic ─────────────────────────────────────────────────────────────────

const SKILL_POOL = [
  'sql', 'python', 'java', 'react', 'typescript', 'javascript', 'node.js', 'aws', 'azure', 'gcp',
  'figma', 'sketch', 'agile', 'scrum', 'jira', 'confluence', 'tableau', 'power bi',
  'machine learning', 'data analysis', 'product management', 'ux research', 'a/b testing',
  'design systems', 'user research', 'prototyping', 'kubernetes', 'docker', 'ci/cd',
  'rest api', 'graphql', 'mongodb', 'postgresql', 'leadership', 'stakeholder management',
  'cross-functional', 'roadmap', 'product strategy', 'metrics', 'kpi', 'go-to-market',
  'swift', 'kotlin', 'flutter', 'react native', 'vue.js', 'angular', 'next.js',
  'growth', 'seo', 'crm', 'salesforce', 'hubspot', 'devops', 'microservices', 'nosql',
]

const STOP = new Set([
  'the','and','or','in','on','at','to','for','of','a','an','is','are','was','were','be',
  'been','have','has','had','do','does','did','will','would','could','should','with','from',
  'by','about','as','into','this','that','we','you','they','our','your','their','who','which',
  'what','all','both','each','more','most','other','some','such','no','not','only','than',
  'too','very','just','can','also','its','role','work','team','new','join','help','strong',
  'good','great','seeking','candidate','required','ability','experience','years','position',
  'job','skills','responsibilities','qualifications','preferred','must','ideal','include',
  'develop','building','working','using','make','take','give','ensure','provide','based',
])

function extractJDKeywords(jd: string): string[] {
  const lower = jd.toLowerCase()
  const multi = SKILL_POOL.filter(s => lower.includes(s))
  const words = lower.replace(/[^a-z0-9+#./\s-]/g, ' ').split(/\s+/)
    .filter(w => w.length > 3 && !STOP.has(w) && !multi.some(m => m.includes(w)))
  const freq: Record<string, number> = {}
  for (const w of words) freq[w] = (freq[w] || 0) + 1
  const raw = Object.entries(freq)
    .filter(([, c]) => c >= 2).sort(([, a], [, b]) => b - a).slice(0, 8).map(([w]) => w)
  return [...new Set([...multi, ...raw])].slice(0, 16)
}

function splitKeywords(kws: string[], resumeText: string) {
  const rt = resumeText.toLowerCase()
  const found: string[] = [], missing: string[] = []
  for (const kw of kws) (rt.includes(kw.toLowerCase()) ? found : missing).push(kw)
  return { found, missing }
}

function computeScore(found: number, total: number, hasJD: boolean) {
  if (!hasJD || total === 0) return 72
  return Math.min(98, Math.round(52 + (found / total) * 40 + (found >= 6 ? 6 : 0)))
}

const FORMAT_CHECKS = [
  { label: 'Standard section headings', pass: true },
  { label: 'Contact info readable by ATS', pass: true },
  { label: 'Quantified achievements present', pass: true },
  { label: 'Action verbs lead each bullet', pass: true },
  { label: 'No graphics in text areas', pass: true },
  { label: 'Date ranges consistently formatted', pass: true },
]

const IcoUpload = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkExp { id: number; title: string; company: string; period: string; bullets: string[] }
interface EduEntry { id: number; degree: string; school: string; period: string }

interface ParsedResume {
  name: string; email: string; location: string; linkedin: string
  jobTitle: string; summary: string; skills: string[]
  workExp: WorkExp[]; education: EduEntry[]
}

// ── Resume Text Parser ────────────────────────────────────────────────────────
function parseResumeText(raw: string): ParsedResume {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)

  // Email
  const email = raw.match(/[\w.+\-]+@[\w\-]+\.[\w.]+/)?.[0] ?? ''

  // LinkedIn
  const linkedin = raw.match(/linkedin\.com\/in\/[\w\-]+/)?.[0] ?? ''

  // Location
  const LOC_ANCHORS = ['India','Karnataka','Maharashtra','Delhi','Haryana','Tamil Nadu','Telangana',
    'Gujarat','West Bengal','Rajasthan','Punjab','Bengaluru','Bangalore','Mumbai','Hyderabad',
    'Chennai','Pune','Gurugram','Noida','Kolkata','Ahmedabad','Jaipur','Kochi','Indore',
    'Remote','USA','United States','UK','Canada','Singapore','Australia']
  let location = ''
  for (const anchor of LOC_ANCHORS) {
    const m = raw.match(new RegExp(`([A-Za-z ]{1,30},?\\s*${anchor})`, 'i'))
    if (m) { location = m[1].trim(); break }
  }

  // Name: first 2–5-word line that looks like a proper name
  const name = lines.find(l => {
    if (l.includes('@') || l.includes('http') || l.includes('|') || l.includes('·')) return false
    if (/^\+?\d/.test(l)) return false
    const words = l.split(/\s+/)
    return words.length >= 2 && words.length <= 5 &&
      words.every(w => /^[A-Z][a-zA-Z'-]*$/.test(w))
  }) ?? lines[0] ?? ''

  // ── Section splitter ──────────────────────────────────────────────────────
  const SECTION_RE: Record<string, RegExp> = {
    summary:    /^(summary|profile|about me|objective|professional summary|career objective|personal statement)/i,
    skills:     /^(skills|core skills|technical skills|competencies|key skills|areas of expertise|tools)/i,
    experience: /^(experience|work experience|employment|professional experience|career history|work history|internship)/i,
    education:  /^(education|academic|qualification|educational background|academic background)/i,
    certifications:/^(certification|certificate|course|training|awards)/i,
  }
  const sections: Record<string, string[]> = { preamble: [] }
  let cur = 'preamble'
  for (const line of lines) {
    let matched = false
    for (const [key, re] of Object.entries(SECTION_RE)) {
      if (re.test(line) && line.length < 60) {
        cur = key; sections[key] = sections[key] ?? []; matched = true; break
      }
    }
    if (!matched) (sections[cur] ??= []).push(line)
  }
  const sec = (k: string) => sections[k] ?? []

  // ── Job title: look in preamble after name ────────────────────────────────
  const TITLE_WORDS = /\b(manager|designer|engineer|developer|analyst|consultant|lead|director|vp|head|architect|scientist|specialist|strategist|associate|intern|officer|coordinator)\b/i
  const preamble = sec('preamble')
  const jobTitle = preamble.find(l =>
    l !== name && !l.includes('@') && !l.includes('http') && !l.match(/^\+?\d/) &&
    TITLE_WORDS.test(l) && l.length < 80
  ) ?? ''

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = sec('summary').filter(l => l.length > 30).join(' ')

  // ── Skills ────────────────────────────────────────────────────────────────
  const skillSet: string[] = []
  for (const line of sec('skills')) {
    const clean = line.replace(/^[•\-*▸◆→>]\s*/, '').replace(/[•|▸◆]/g, ',')
    clean.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40).forEach(s => skillSet.push(s))
  }

  // ── Work Experience ───────────────────────────────────────────────────────
  const DATE_RE = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i
  const PERIOD_RE = /(\d{4})\s*[-–—]\s*(\d{4}|present|current|now|till date)/i

  interface RawExp { title: string; company: string; period: string; bullets: string[] }
  const workExps: RawExp[] = []
  let curExp: Partial<RawExp> | null = null

  const flushExp = () => {
    if (curExp?.title) {
      workExps.push({
        title: curExp.title,
        company: curExp.company ?? '',
        period: curExp.period ?? '',
        bullets: curExp.bullets?.length ? curExp.bullets : [''],
      })
    }
    curExp = null
  }

  for (const line of sec('experience')) {
    const isBullet = /^[•\-*◆▸→>•]\s/.test(line) || /^\d+\.\s/.test(line)
    const hasPeriod = PERIOD_RE.test(line)
    const hasDate   = DATE_RE.test(line) && line.length < 100

    if (isBullet) {
      if (curExp) curExp.bullets = [...(curExp.bullets ?? []), line.replace(/^[•\-*◆▸→>•1-9.]\s*/, '').trim()]
    } else if (hasPeriod) {
      const pm = line.match(PERIOD_RE)!
      const period = `${pm[1]} — ${pm[2].toUpperCase().replace(/CURRENT|NOW|TILL DATE/, 'PRESENT')}`
      const company = line.replace(pm[0], '').replace(/[|,·\t]/g, '').trim()
      if (curExp && !curExp.period) {
        curExp.period = period
        if (company && company.length > 1 && !curExp.company) curExp.company = company
      } else {
        flushExp()
        curExp = { period, company, bullets: [] }
      }
    } else if (hasDate && line.length < 80) {
      // Company + date on same line without full period match
      const yearMatch = line.match(/(\d{4})/)
      if (curExp && !curExp.company) {
        curExp.company = line.replace(yearMatch?.[0] ?? '', '').replace(/[|,·]/g, '').trim()
        curExp.period = curExp.period ?? yearMatch?.[1] ?? ''
      }
    } else if (line.length > 3 && line.length < 90 && !line.includes('@') && !line.includes('http')) {
      // Check if this is a role title (not a bullet continuation)
      const looksLikeTitle = TITLE_WORDS.test(line) || line.split(/\s+/).length <= 6
      if (looksLikeTitle) {
        flushExp()
        curExp = { title: line, bullets: [] }
      } else if (curExp && !curExp.company) {
        curExp.company = line
      }
    }
  }
  flushExp()

  // ── Education ─────────────────────────────────────────────────────────────
  const DEGREE_RE = /\b(b\.?tech|b\.?e|b\.?sc|m\.?tech|m\.?sc|mba|phd|bachelor|master|doctor|b\.des|m\.des|bca|mca|b\.com|m\.com|diploma|pgdm|bba|llb|llm|b\.arch)\b/i
  interface RawEdu { degree: string; school: string; period: string }
  const edus: RawEdu[] = []
  let curEdu: Partial<RawEdu> | null = null

  for (const line of sec('education')) {
    const yearMatch = line.match(/(\d{4})\s*[-–—]\s*(\d{4}|present|\w+)/i)
    if (DEGREE_RE.test(line)) {
      if (curEdu?.degree) edus.push({ degree: curEdu.degree, school: curEdu.school ?? '', period: curEdu.period ?? '' })
      curEdu = { degree: line.replace(yearMatch?.[0] ?? '', '').trim() }
      if (yearMatch) curEdu.period = `${yearMatch[1]} — ${yearMatch[2]}`
    } else if (yearMatch) {
      if (curEdu) {
        if (!curEdu.period) curEdu.period = `${yearMatch[1]} — ${yearMatch[2]}`
        const school = line.replace(yearMatch[0], '').replace(/[|,·]/g, '').trim()
        if (school && !curEdu.school) curEdu.school = school
      }
    } else if (line.length > 3 && line.length < 100) {
      if (curEdu && !curEdu.school) curEdu.school = line
      else if (!curEdu) curEdu = { degree: line }
    }
  }
  if (curEdu?.degree) edus.push({ degree: curEdu.degree, school: curEdu.school ?? '', period: curEdu.period ?? '' })

  return {
    name,
    email,
    location,
    linkedin,
    jobTitle,
    summary,
    skills: [...new Set(skillSet)].slice(0, 24),
    workExp: workExps.map((e, i) => ({ id: i + 1, ...e })),
    education: edus.map((e, i) => ({ id: i + 1, ...e })),
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResumeBuilder() {
  const { user } = useAuth()

  // UI state
  const [saved, setSaved]               = useState(false)
  const [activeTab, setActiveTab]       = useState<'import' | 'jd' | 'editor'>('import')
  const [importFile,    setImportFile]    = useState<File | null>(null)
  const [parsedResume,  setParsedResume]  = useState<ParsedResume | null>(null)
  const [parsing,       setParsing]       = useState(false)
  const [importError,   setImportError]   = useState('')
  const [dragOver,      setDragOver]      = useState(false)
  const fileInputRef                      = useRef<HTMLInputElement>(null)
  const [showCustomize, setShowCustomize] = useState(false)
  const [showShare, setShowShare]       = useState(false)
  const [copied, setCopied]             = useState(false)
  const [zoom, setZoom]                 = useState(85)
  const shareRef                        = useRef<HTMLDivElement>(null)

  // Customization state
  const [selectedTemplate, setSelectedTemplate] = useState('editorial')
  const [headerColor, setHeaderColor]   = useState('#0f172a')
  const [resumeAccent, setResumeAccent] = useState('#2563EB')
  const [selectedFont, setSelectedFont] = useState('georgia')

  const resumeFont = FONT_OPTIONS.find(f => f.id === selectedFont)?.family ?? 'Georgia, serif'
  const templateName = TEMPLATES.find(t => t.id === selectedTemplate)?.name ?? 'Editorial Pro'

  // Job target state
  const [jobUrl, setJobUrl]     = useState('')
  const [jobDesc, setJobDesc]   = useState('')
  const [analysed, setAnalysed] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [tailored, setTailored] = useState(false)
  const [keywords, setKeywords] = useState<{ found: string[]; missing: string[] }>({ found: [], missing: [] })

  // Resume fields
  const [name,     setName]     = useState(user?.name ?? 'Akash Lamba')
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? 'Product Designer')
  const [email,    setEmail]    = useState(user?.email ?? 'lamba.akash1994@gmail.com')
  const [location, setLocation] = useState('Bangalore, India')
  const [linkedin, setLinkedin] = useState('linkedin.com/in/akshlamba')
  const [summary,  setSummary]  = useState(
    `${user?.jobTitle ?? 'Product Designer'} with 6+ years of experience building user-centric digital products. Led end-to-end design for consumer apps reaching 2M+ users. Proven track record of cross-functional collaboration with engineering and product stakeholders to ship high-impact features on time.`
  )
  const [skills,   setSkills]   = useState([
    'Product Strategy', 'UX Research', 'Figma', 'Design Systems',
    'Prototyping', 'A/B Testing', 'User Interviews', 'Data Analysis',
  ])
  const [newSkill, setNewSkill] = useState('')
  const [workExp, setWorkExp]   = useState<WorkExp[]>([
    { id: 1, title: 'Senior Product Designer', company: 'Razorpay', period: '2021 — PRESENT', bullets: [
      'Led redesign of the merchant onboarding flow, reducing drop-off by 34% and increasing activation by 28%.',
      'Built and maintained a cross-platform design system used by 20+ engineers across 3 products.',
    ]},
    { id: 2, title: 'Product Designer', company: 'Swiggy', period: '2018 — 2021', bullets: [
      'Designed the restaurant discovery experience used by 8M+ daily active users across India.',
      'Ran 12 A/B tests per quarter; shipped variants that increased order conversion by 18%.',
    ]},
  ])
  const [openExp, setOpenExp] = useState<number | null>(1)
  const [education] = useState<EduEntry[]>([
    { id: 1, degree: 'B.Des — Interaction Design', school: 'National Institute of Design', period: '2014 — 2018' },
  ])

  // Derived
  const resumeText = useMemo(() => [
    name, jobTitle, summary, skills.join(' '),
    ...workExp.flatMap(e => [e.title, e.company, ...e.bullets]),
    ...education.flatMap(e => [e.degree, e.school]),
  ].join(' '), [name, jobTitle, summary, skills, workExp, education])

  const atsScore   = useMemo(() => computeScore(keywords.found.length, keywords.found.length + keywords.missing.length, analysed), [keywords, analysed])
  const scoreColor = atsScore >= 85 ? '#10B981' : atsScore >= 65 ? '#F59E0B' : '#EF4444'
  const scorePct   = `${atsScore}%`
  const matchedKwSet = useMemo(() => new Set(keywords.found.map(k => k.toLowerCase())), [keywords.found])

  // Close share popover on outside click
  useEffect(() => {
    if (!showShare) return
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShare(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShare])

  // Handlers
  const handleAnalyse = () => {
    if (!jobDesc.trim() && !jobUrl.trim()) return
    setAnalysing(true)
    setTimeout(() => {
      const fallback = `${jobTitle} role. Requirements: UX Research, Figma, Design Systems, Prototyping, Stakeholder Management, Data Analysis, A/B Testing, Cross-functional, Roadmap, User Research, Product Strategy, Agile, Metrics.`
      const kws = extractJDKeywords(jobDesc.trim() || fallback)
      setKeywords(splitKeywords(kws, resumeText))
      setAnalysed(true)
      setAnalysing(false)
    }, 950)
  }

  const handleTailor = () => {
    const topMissing = keywords.missing.slice(0, 3)
    if (topMissing.length > 0) {
      const additions = topMissing.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ')
      setSummary(prev => prev.replace(/\.$/, '') + `. Skilled in ${additions}.`)
      setKeywords(prev => ({ found: [...prev.found, ...prev.missing.slice(0, 3)], missing: prev.missing.slice(3) }))
    }
    setTailored(true)
    setActiveTab('editor')
  }

  const addMissingKw = (kw: string) => {
    const skill = kw.charAt(0).toUpperCase() + kw.slice(1)
    if (!skills.includes(skill)) setSkills(prev => [...prev, skill])
    setKeywords(prev => ({ found: [...prev.found, kw], missing: prev.missing.filter(k => k !== kw) }))
  }

  const addSkill = (sk: string) => {
    const t = sk.trim()
    if (t && !skills.includes(t)) setSkills(prev => [...prev, t])
    setNewSkill('')
  }

  const updateBullet = (expId: number, idx: number, val: string) =>
    setWorkExp(prev => prev.map(e => e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => i === idx ? val : b) } : e))

  const addBullet = (expId: number) =>
    setWorkExp(prev => prev.map(e => e.id === expId ? { ...e, bullets: [...e.bullets, ''] } : e))

  const processFile = useCallback(async (file: File) => {
    setImportError('')
    setImportFile(file)
    setParsing(true)
    try {
      const text = await extractTextFromFile(file)
      if (!text.trim()) throw new Error('Could not read any text from this file. Try a different format.')
      const result = parseResumeText(text)
      setParsedResume(result)
    } catch (err: any) {
      setImportError(err.message ?? 'Failed to read file. Please try a PDF, DOCX, or TXT.')
      setImportFile(null)
    } finally {
      setParsing(false)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleApplyParsed = () => {
    if (!parsedResume) return
    if (parsedResume.name)     setName(parsedResume.name)
    if (parsedResume.email)    setEmail(parsedResume.email)
    if (parsedResume.location) setLocation(parsedResume.location)
    if (parsedResume.linkedin) setLinkedin(parsedResume.linkedin)
    if (parsedResume.jobTitle) setJobTitle(parsedResume.jobTitle)
    if (parsedResume.summary)  setSummary(parsedResume.summary)
    if (parsedResume.skills.length > 0) setSkills(parsedResume.skills)
    if (parsedResume.workExp.length > 0) { setWorkExp(parsedResume.workExp); setOpenExp(parsedResume.workExp[0].id) }
    setParsedResume(null)
    setImportFile(null)
    setActiveTab('editor')
  }

  const handleSave = () => {
    if (!user) return
    addResume(user.email, `${jobTitle} — ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}.pdf`, atsScore)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openPrintWindow = () => {
    const resumeEl = document.querySelector('.resume-doc') as HTMLElement | null
    if (!resumeEl) return

    // Capture current theme so CSS variables resolve correctly
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'

    // Extract all CSS rules from same-origin stylesheets
    let cssText = ''
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        cssText += Array.from(sheet.cssRules).map(r => r.cssText).join('\n')
      } catch { /* cross-origin (Google Fonts), skip */ }
    })

    const win = window.open('', '_blank', 'width=900,height=1200')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html data-theme="${currentTheme}"><head>
  <meta charset="utf-8">
  <title>${name} — Resume</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
  <style>
${cssText}
/* ── Print overrides ── */
*, *::before, *::after {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}
body { margin: 0; padding: 0; background: #fff; }
.resume-doc {
  width: 210mm;
  min-height: 297mm;
  max-width: none !important;
  box-shadow: none !important;
  transform: none !important;
  border-radius: 0 !important;
  border: none !important;
  margin: 0 auto;
}
@page { size: A4; margin: 0; }
  </style>
</head>
<body>${resumeEl.outerHTML}</body>
</html>`)
    win.document.close()
    // Wait for fonts + styles to fully load before triggering print
    setTimeout(() => { win.focus(); win.print() }, 1200)
  }

  const handlePrint = () => {
    setShowShare(false)
    setTimeout(openPrintWindow, 100)
  }

  const handleEmail = () => {
    setShowShare(false)
    const subject = encodeURIComponent(`${name} — Resume`)
    const body = encodeURIComponent(`Hi,\n\nPlease find my resume attached.\n\nBest regards,\n${name}`)
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank')
  }

  const resetAnalysis = () => { setAnalysed(false); setTailored(false); setKeywords({ found: [], missing: [] }) }

  const selectTemplate = (t: typeof TEMPLATES[0]) => {
    setSelectedTemplate(t.id)
    setHeaderColor(t.headerBg)
  }

  return (
    <div className="builder-layout">

      {/* ── Left Panel ──────────────────────────────────────────── */}
      <div className="builder-left" style={{ width: 390, overflow: 'hidden', padding: 0, gap: 0 }}>

        {/* Tab switcher */}
        <div className="rb-tabs">
          <button className={`rb-tab${activeTab === 'import' ? ' active' : ''}`} onClick={() => setActiveTab('import')}>
            <IcoUpload size={13} /> Import
          </button>
          <button className={`rb-tab${activeTab === 'jd' ? ' active' : ''}`} onClick={() => setActiveTab('jd')}>
            <IcoTarget /> Job Target
            {analysed && <span className="rb-tab-dot" style={{ background: scoreColor }} />}
          </button>
          <button className={`rb-tab${activeTab === 'editor' ? ' active' : ''}`} onClick={() => setActiveTab('editor')}>
            <IcoEditPen /> Edit Resume
          </button>
        </div>

        {/* ─── IMPORT TAB ─── */}
        {activeTab === 'import' && (
          <div className="rb-tab-content">

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />

            {!parsedResume ? (
              <>
                <div>
                  <h2 className="builder-title" style={{ fontSize: 17, marginBottom: 4 }}>Import Your Resume</h2>
                  <p className="builder-sub">Upload your existing resume and we'll extract all your information automatically — name, experience, skills, education, and more.</p>
                </div>

                {/* Drop zone */}
                <div
                  onClick={() => !parsing && fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '36px 20px',
                    textAlign: 'center',
                    cursor: parsing ? 'not-allowed' : 'pointer',
                    background: dragOver ? 'var(--blue-50)' : 'var(--bg-soft)',
                    transition: 'all 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {parsing ? (
                    <>
                      <span className="rb-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Reading your resume…</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-mute)' }}>
                        {importFile?.name ?? 'Processing file'}
                      </div>
                    </>
                  ) : importFile && !parsedResume ? (
                    <>
                      <div style={{ fontSize: 36 }}>📄</div>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>{importFile.name}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--blue-50)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
                        <IcoUpload size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)', marginBottom: 4 }}>
                          Drop your resume here
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>
                          or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>click to browse</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {['PDF', 'DOCX', 'DOC', 'TXT'].map(fmt => (
                          <span key={fmt} style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-mute)' }}>
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {importError && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 12.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ flexShrink: 0 }}>⚠️</span>
                    <span>{importError}</span>
                  </div>
                )}

                <button
                  onClick={() => setActiveTab('editor')}
                  style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-mute)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Skip — start from scratch
                </button>

                {/* What gets imported */}
                <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-mute)', marginBottom: 8 }}>WHAT GETS IMPORTED</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      'Name, email, location, LinkedIn URL',
                      'Professional summary / objective',
                      'Skills list',
                      'Work experience with bullet points',
                      'Education entries',
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-soft)' }}>
                        <span style={{ width: 16, height: 16, borderRadius: 5, background: 'var(--blue-50)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <IconCheck size={9} />
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 10, lineHeight: 1.5 }}>
                    Works best with text-based PDFs. Scanned image PDFs may not extract correctly.
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Parse results preview */}
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 14px', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#15803D', marginBottom: 8 }}>
                    ✅ Resume parsed successfully
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: '#166534' }}>
                    {parsedResume.name     && <div>👤 <strong>Name:</strong> {parsedResume.name}</div>}
                    {parsedResume.email    && <div>📧 <strong>Email:</strong> {parsedResume.email}</div>}
                    {parsedResume.location && <div>📍 <strong>Location:</strong> {parsedResume.location}</div>}
                    {parsedResume.jobTitle && <div>💼 <strong>Title:</strong> {parsedResume.jobTitle}</div>}
                    {parsedResume.skills.length > 0 && <div>🎯 <strong>{parsedResume.skills.length} skills</strong> detected</div>}
                    {parsedResume.workExp.length > 0 && <div>🏢 <strong>{parsedResume.workExp.length} experience</strong> {parsedResume.workExp.length === 1 ? 'entry' : 'entries'} found</div>}
                    {parsedResume.education.length > 0 && <div>🎓 <strong>{parsedResume.education.length} education</strong> {parsedResume.education.length === 1 ? 'entry' : 'entries'} found</div>}
                    {parsedResume.summary  && <div>📝 <strong>Summary</strong> detected ({parsedResume.summary.length} chars)</div>}
                  </div>
                </div>

                {/* Missing fields warning */}
                {(!parsedResume.name || !parsedResume.summary || parsedResume.workExp.length === 0) && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400E' }}>
                    ⚠️ Some fields weren't detected. You can fill them in manually after importing.
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="rb-tailor-btn" style={{ border: 'none' }} onClick={handleApplyParsed}>
                    <IcoEditPen size={13} /> Apply &amp; Edit Resume →
                  </button>
                  <button
                    onClick={() => setParsedResume(null)}
                    style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-mute)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    ← Try again with different text
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── JOB TARGET TAB ─── */}
        {activeTab === 'jd' && (
          <div className="rb-tab-content">
            {!analysed ? (
              <>
                <div>
                  <h2 className="builder-title" style={{ fontSize: 17, marginBottom: 4 }}>Target a Job</h2>
                  <p className="builder-sub">Paste the job description to get a live ATS score and tailor your resume to the role.</p>
                </div>

                <div>
                  <div className="f-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <IcoLink2 size={12} /> LinkedIn Job URL or ID
                  </div>
                  <input className="f-input" placeholder="https://linkedin.com/jobs/view/1234567890"
                    value={jobUrl} onChange={e => setJobUrl(e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>
                    We'll auto-fetch the JD — or paste below
                  </div>
                </div>

                <div className="rb-or-divider"><span>OR</span></div>

                <div>
                  <div className="f-label" style={{ marginBottom: 5 }}>Paste Job Description</div>
                  <textarea className="f-textarea"
                    placeholder="Paste the full job description here — include requirements, responsibilities, and qualifications for the best tailoring results…"
                    value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                    rows={10} style={{ minHeight: 200, resize: 'vertical' }} />
                </div>

                <button className="rb-analyse-btn" onClick={handleAnalyse} disabled={analysing}>
                  {analysing ? <><span className="rb-spinner" /> Analysing JD…</> : <><IcoLightning size={14} /> Analyse &amp; Score Resume</>}
                </button>
              </>
            ) : (
              <>
                <div className="ats-score-card">
                  <div className="ats-ring-wrap">
                    <div className="ats-ring-lg"
                      style={{ background: `conic-gradient(${scoreColor} 0% ${scorePct}, var(--border) ${scorePct} 100%)` }}>
                      <div className="ats-ring-inner">
                        <div className="ats-num" style={{ color: scoreColor }}>{atsScore}</div>
                        <div className="ats-denom">/ 100</div>
                      </div>
                    </div>
                    <div>
                      <div className="ats-title-label">ATS SCORE</div>
                      <div className={`ats-verdict ${atsScore >= 85 ? 'good' : atsScore >= 65 ? 'ok' : 'bad'}`}>
                        {atsScore >= 85 ? '✅ ATS Friendly' : atsScore >= 65 ? '⚠️ Needs Work' : '❌ Poor Match'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 4 }}>
                        {keywords.found.length} of {keywords.found.length + keywords.missing.length} keywords matched
                      </div>
                    </div>
                  </div>
                  <button className="rb-change-jd" onClick={resetAnalysis}>Change JD</button>
                </div>

                {keywords.found.length > 0 && (
                  <div className="ats-kw-section">
                    <div className="ats-kw-head">KEYWORDS MATCHED <span className="ats-kw-count good">{keywords.found.length}</span></div>
                    <div className="ats-kw-grid">
                      {keywords.found.map(kw => <span key={kw} className="ats-kw-chip found"><IconCheck size={9} /> {kw}</span>)}
                    </div>
                  </div>
                )}

                {keywords.missing.length > 0 && (
                  <div className="ats-kw-section">
                    <div className="ats-kw-head">MISSING — CLICK TO ADD <span className="ats-kw-count bad">{keywords.missing.length}</span></div>
                    <div className="ats-kw-grid">
                      {keywords.missing.map(kw => (
                        <button key={kw} className="ats-kw-chip missing" onClick={() => addMissingKw(kw)}>+ {kw}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ats-kw-section">
                  <div className="ats-kw-head">FORMAT CHECKS</div>
                  <div className="ats-format-list">
                    {FORMAT_CHECKS.map((fc, i) => (
                      <div key={i} className="ats-format-row">
                        <span className={`ats-format-ico ${fc.pass ? 'pass' : 'warn'}`}>
                          {fc.pass ? <IconCheck size={9} /> : <IcoWarn size={9} />}
                        </span>
                        <span>{fc.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {!tailored && keywords.missing.length > 0 && (
                  <button className="rb-tailor-btn" onClick={handleTailor}>
                    <IconSparkle size={13} /> Auto-Tailor with AI
                    <span style={{ fontSize: 10.5, opacity: 0.75, marginLeft: 4 }}>
                      adds {Math.min(3, keywords.missing.length)} keywords
                    </span>
                  </button>
                )}

                {tailored && (
                  <div className="rb-tailored-notice">
                    <IconCheck size={12} /> Resume has been tailored for this role
                  </div>
                )}

                <button className="rb-edit-resume-btn" onClick={() => setActiveTab('editor')}>
                  <IcoEditPen size={13} /> Edit Resume Manually →
                </button>
              </>
            )}
          </div>
        )}

        {/* ─── EDITOR TAB ─── */}
        {activeTab === 'editor' && (
          <div className="rb-tab-content">

            <div className="ai-insight">
              <div className="ai-label"><IconSparkle size={12} /> AI INSIGHT</div>
              <p>
                {analysed
                  ? `Score: ${atsScore}/100 for this role. ${keywords.missing.length > 0 ? `Adding "${keywords.missing[0]}" could boost your score by ~8 points.` : 'Great keyword coverage!'}`
                  : 'Add a job target first to get personalised ATS suggestions.'}
              </p>
              <div className="ai-insight-btns">
                <button onClick={() => setActiveTab('jd')}>{analysed ? '↺ Change Job' : '🎯 Add Job Target'}</button>
                {analysed && <button onClick={() => setSummary(`Experienced ${jobTitle} with a strong track record of delivering scalable, user-centred products. Expert in cross-functional collaboration with engineering, product, and business stakeholders.`)}>Optimise Tone</button>}
              </div>
            </div>

            <div>
              <div className="form-section-head"><IconUser size={14} /> Personal Information</div>
              <div className="form-grid">
                <div><div className="f-label">Full Name</div><input className="f-input" value={name} onChange={e => setName(e.target.value)} /></div>
                <div><div className="f-label">Job Title</div><input className="f-input" value={jobTitle} onChange={e => setJobTitle(e.target.value)} /></div>
                <div><div className="f-label">Email</div><input className="f-input" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><div className="f-label">Location</div><input className="f-input" value={location} onChange={e => setLocation(e.target.value)} /></div>
                <div style={{ gridColumn: '1 / -1' }}><div className="f-label">LinkedIn URL</div><input className="f-input" value={linkedin} onChange={e => setLinkedin(e.target.value)} /></div>
              </div>
            </div>

            <div>
              <div className="form-section-head" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconDoc size={14} /> Professional Summary</span>
                <span className="regen-link" onClick={() => setSummary(`Experienced ${jobTitle} with a proven track record of building impactful, user-centred products at scale. Skilled in cross-functional collaboration, data-driven decision making, and delivering features that move key business metrics.`)}>
                  Regenerate with AI
                </span>
              </div>
              <textarea className="f-textarea" value={summary} onChange={e => setSummary(e.target.value)} rows={5} />
            </div>

            <div>
              <div className="form-section-head"><IconBriefcase size={14} /> Core Skills</div>
              <div className="rb-skill-chips">
                {skills.map(sk => (
                  <div key={sk} className={`rb-skill-chip${matchedKwSet.has(sk.toLowerCase()) ? ' matched' : ''}`}>
                    {sk}
                    <button onClick={() => setSkills(prev => prev.filter(s => s !== sk))}><IcoX size={10} /></button>
                  </div>
                ))}
                <div className="rb-skill-add">
                  <input className="rb-skill-input" placeholder="Add skill…" value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { addSkill(newSkill); e.preventDefault() } }} />
                </div>
              </div>
            </div>

            <div>
              <div className="form-section-head"><IconBriefcase size={14} /> Work Experience</div>
              {workExp.map(exp => (
                <div key={exp.id} className="rb-exp-entry">
                  <button className="rb-exp-header" onClick={() => setOpenExp(openExp === exp.id ? null : exp.id)}>
                    <div>
                      <div className="rb-exp-role">{exp.title}</div>
                      <div className="rb-exp-co">{exp.company} · {exp.period}</div>
                    </div>
                    <span className={`rb-exp-chev${openExp === exp.id ? ' open' : ''}`}><IcoChevDown /></span>
                  </button>
                  {openExp === exp.id && (
                    <div className="rb-exp-body">
                      <div><div className="f-label">Job Title</div>
                        <input className="f-input" value={exp.title}
                          onChange={e => setWorkExp(prev => prev.map(x => x.id === exp.id ? { ...x, title: e.target.value } : x))} />
                      </div>
                      <div className="form-grid" style={{ marginTop: 8 }}>
                        <div><div className="f-label">Company</div>
                          <input className="f-input" value={exp.company}
                            onChange={e => setWorkExp(prev => prev.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x))} />
                        </div>
                        <div><div className="f-label">Period</div>
                          <input className="f-input" value={exp.period}
                            onChange={e => setWorkExp(prev => prev.map(x => x.id === exp.id ? { ...x, period: e.target.value } : x))} />
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div className="f-label" style={{ marginBottom: 6 }}>Bullet Points</div>
                        {exp.bullets.map((b, i) => (
                          <textarea key={i} className="f-textarea" value={b}
                            onChange={e => updateBullet(exp.id, i, e.target.value)}
                            rows={2} style={{ minHeight: 'unset', marginBottom: 6 }} />
                        ))}
                        <button className="rb-add-bullet" onClick={() => addBullet(exp.id)}>
                          <IconPlus size={10} /> Add bullet point
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button className="rb-add-exp" onClick={() => {
                const n = { id: Date.now(), title: 'New Role', company: 'Company', period: '20XX — 20XX', bullets: [''] }
                setWorkExp(prev => [...prev, n]); setOpenExp(n.id)
              }}>
                <IconPlus size={12} /> Add Experience
              </button>
            </div>

            <div>
              <div className="form-section-head"><IconDoc size={14} /> Education</div>
              {education.map(edu => (
                <div key={edu.id}>
                  <div style={{ marginBottom: 8 }}><div className="f-label">Degree</div><input className="f-input" defaultValue={edu.degree} /></div>
                  <div className="form-grid">
                    <div><div className="f-label">School</div><input className="f-input" defaultValue={edu.school} /></div>
                    <div><div className="f-label">Period</div><input className="f-input" defaultValue={edu.period} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="builder-bottom-bar" style={{ margin: 0, padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
          <div className="undo-redo">
            <button title="Undo"><IconUndo size={13} /></button>
            <button title="Redo"><IconRedo size={13} /></button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} style={{
              height: 36, padding: '0 13px', borderRadius: 8, border: '1px solid var(--border)',
              background: saved ? 'var(--blue-50)' : 'var(--card)',
              color: saved ? 'var(--accent)' : 'var(--text-soft)',
              fontSize: 13, cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
            }}>{saved ? '✓ Saved!' : 'Save Draft'}</button>
            <button className="btn-download" onClick={openPrintWindow}><IconDownload size={13} /> Download PDF</button>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Live Resume Preview ──────────────── */}
      <div className="builder-right" style={{ position: 'relative' }}>

        {/* Toolbar */}
        <div className="builder-right-head">
          <div className="template-tag">TEMPLATE: <strong>{templateName.toUpperCase()}</strong></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {analysed && (
              <div className="rb-ats-mini" style={{ borderColor: scoreColor }}>
                <div className="rb-ats-mini-ring"
                  style={{ background: `conic-gradient(${scoreColor} 0% ${scorePct}, var(--border) ${scorePct} 100%)` }}>
                  <div className="rb-ats-mini-inner" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{atsScore}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.06em' }}>ATS</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-mute)', fontSize: 13 }}>
              <button
                onClick={() => setZoom(z => Math.max(50, z - 5))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'flex' }}
                title="Zoom out"
              ><IconZoomOut size={15} /></button>
              <span style={{ minWidth: 34, textAlign: 'center', fontWeight: 600 }}>{zoom}%</span>
              <button
                onClick={() => setZoom(z => Math.min(130, z + 5))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'flex' }}
                title="Zoom in"
              ><IconZoomIn size={15} /></button>
            </div>
          </div>

          <div className="builder-actions">
            {/* Customize button */}
            <button
              onClick={() => { setShowCustomize(v => !v); setShowShare(false) }}
              style={showCustomize ? { background: 'var(--blue-50)', color: 'var(--accent)', borderColor: 'var(--blue-200)' } : {}}
            >
              <IconCustomize size={13} /> Customize
            </button>

            {/* Share button with popover */}
            <div ref={shareRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowShare(v => !v); setShowCustomize(false) }}
                style={showShare ? { background: 'var(--blue-50)', color: 'var(--accent)', borderColor: 'var(--blue-200)' } : {}}
              >
                <IconShare size={13} /> Share
              </button>

              {showShare && (
                <div className="rb-share-pop">
                  <div className="rb-share-header">Export &amp; Share</div>
                  <button className="rb-share-item" onClick={handleCopyLink}>
                    <span className="rb-share-icon blue"><IcoLink2 size={14} /></span>
                    <div>
                      <div className="rb-share-item-title">{copied ? '✓ Link copied!' : 'Copy shareable link'}</div>
                      <div className="rb-share-item-sub">Share your resume page</div>
                    </div>
                  </button>
                  <button className="rb-share-item" onClick={handlePrint}>
                    <span className="rb-share-icon green"><IcoPrint size={14} /></span>
                    <div>
                      <div className="rb-share-item-title">Print / Save as PDF</div>
                      <div className="rb-share-item-sub">Download via browser dialog</div>
                    </div>
                  </button>
                  <button className="rb-share-item" onClick={handleEmail}>
                    <span className="rb-share-icon amber"><IcoMail size={14} /></span>
                    <div>
                      <div className="rb-share-item-title">Email resume</div>
                      <div className="rb-share-item-sub">Opens your email client</div>
                    </div>
                  </button>
                  <div className="rb-share-divider" />
                  <button className="rb-share-item" onClick={() => { handleSave(); setShowShare(false) }}>
                    <span className="rb-share-icon slate"><IconDownload size={14} /></span>
                    <div>
                      <div className="rb-share-item-title">Save draft</div>
                      <div className="rb-share-item-sub">Save to your dashboard</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resume Document */}
        <div className="resume-preview">
          <div className="resume-doc" style={{ fontFamily: resumeFont, transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
            <div className="resume-doc-head" style={{ background: headerColor }}>
              <div className="rname">{name}</div>
              <div className="rtitle">{jobTitle}</div>
              <div className="rcontact">{email} · {location.toUpperCase()} · {linkedin.toUpperCase()}</div>
            </div>
            <div className="resume-doc-body">
              <div className="resume-col">
                <div className="resume-sec-title" style={{ color: resumeAccent }}>Core Skills</div>
                {skills.map(sk => (
                  <span key={sk}
                    className={`resume-skill${[...matchedKwSet].some(k => sk.toLowerCase().includes(k)) ? ' matched' : ''}`}
                    style={[...matchedKwSet].some(k => sk.toLowerCase().includes(k)) ? { background: `${resumeAccent}18`, color: resumeAccent, border: `1px solid ${resumeAccent}40` } : {}}
                  >{sk}</span>
                ))}
                <div className="resume-sec-title" style={{ marginTop: 18, color: resumeAccent }}>Education</div>
                {education.map(edu => (
                  <div key={edu.id} className="resume-entry">
                    <div className="title">{edu.degree}</div>
                    <div className="sub">{edu.school}</div>
                    <div className="sub">{edu.period}</div>
                  </div>
                ))}
              </div>
              <div className="resume-col">
                <div className="resume-sec-title" style={{ color: resumeAccent }}>Professional Summary</div>
                <p style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.6, marginBottom: 14 }}>{summary}</p>
                <div className="resume-sec-title" style={{ color: resumeAccent }}>Work Experience</div>
                {workExp.map(exp => (
                  <div key={exp.id} className="resume-entry">
                    <div className="title">{exp.title}</div>
                    <div className="sub" style={{ color: resumeAccent, fontWeight: 600 }}>{exp.company}</div>
                    <div className="sub">{exp.period}</div>
                    <ul>{exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Customize Panel (slide-over) ── */}
        {showCustomize && (
          <>
            <div className="rb-cust-backdrop" onClick={() => setShowCustomize(false)} />
            <div className="rb-cust-panel">
              <div className="rb-cust-header">
                <span>Customize Resume</span>
                <button className="rb-cust-close" onClick={() => setShowCustomize(false)}><IcoX size={13} /></button>
              </div>

              <div className="rb-cust-body">
                {/* Template */}
                <div className="rb-cust-section">
                  <div className="rb-cust-label">TEMPLATE</div>
                  <div className="rb-template-grid">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        className={`rb-template-card${selectedTemplate === t.id ? ' active' : ''}`}
                        onClick={() => selectTemplate(t)}
                      >
                        <div className="rb-tmpl-preview">
                          <div className="rb-tmpl-head" style={{ background: t.headerBg }} />
                          <div className="rb-tmpl-lines">
                            <div /><div /><div style={{ width: '60%' }} />
                          </div>
                        </div>
                        <div className="rb-tmpl-name">{t.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent color */}
                <div className="rb-cust-section">
                  <div className="rb-cust-label">ACCENT COLOR</div>
                  <div className="rb-swatch-row">
                    {ACCENT_COLORS.map(c => (
                      <button
                        key={c.value}
                        className={`rb-swatch${resumeAccent === c.value ? ' active' : ''}`}
                        style={{ background: c.value }}
                        title={c.label}
                        onClick={() => setResumeAccent(c.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Font */}
                <div className="rb-cust-section">
                  <div className="rb-cust-label">RESUME FONT</div>
                  <div className="rb-font-opts">
                    {FONT_OPTIONS.map(f => (
                      <button
                        key={f.id}
                        className={`rb-font-opt${selectedFont === f.id ? ' active' : ''}`}
                        style={{ fontFamily: f.family }}
                        onClick={() => setSelectedFont(f.id)}
                      >
                        <span className="rb-font-preview">Ag</span>
                        <span className="rb-font-name">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview tip */}
                <div className="rb-cust-tip">
                  Changes apply live to the preview on the left →
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
