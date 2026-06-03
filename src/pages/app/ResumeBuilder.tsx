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
    let linkedinAnnotation = ''
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
      // Extract hyperlink annotations to find LinkedIn URL (not visible as text in PDF)
      if (!linkedinAnnotation) {
        const annotations = await page.getAnnotations()
        for (const ann of annotations as any[]) {
          if (ann.url && /linkedin\.com\/in\//i.test(ann.url)) {
            linkedinAnnotation = ann.url
            break
          }
        }
      }
    }
    // Prepend LinkedIn URL so the text parser can pick it up
    if (linkedinAnnotation) text = linkedinAnnotation + '\n' + text
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

function computeScore(found: number, total: number, hasJD: boolean, resumeText?: string) {
  if (!hasJD || total === 0) return 72

  // Base score
  let score = 60

  // Keyword match (up to 25 points)
  const keywordBonus = (found / Math.max(total, 1)) * 25
  score += keywordBonus

  // Content quality bonus (up to 15 points)
  // Check if resume has metrics, numbers, achievements
  if (resumeText) {
    const hasMetrics = /\d+[%+\-]|[$€£¥]\d+|x\s*\d+/.test(resumeText)
    const hasImpact = /improved|increased|achieved|delivered|generated|secured|reduced|accelerated/i.test(resumeText)
    const hasBullets = (resumeText.match(/[•\-*]\s/g) || []).length >= 5
    const hasQuantity = (resumeText.match(/\d+/g) || []).length >= 8

    let qualityPoints = 0
    if (hasMetrics) qualityPoints += 4
    if (hasImpact) qualityPoints += 4
    if (hasBullets) qualityPoints += 4
    if (hasQuantity) qualityPoints += 3

    score += Math.min(qualityPoints, 15)
  }

  return Math.min(98, Math.round(score))
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
  aiUsed?: boolean
}

// ── Resume Text Parser ────────────────────────────────────────────────────────
function parseResumeText(raw: string): ParsedResume {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)

  // ── Email ─────────────────────────────────────────────────────────────────
  const email = raw.match(/[\w.+\-]+@[\w\-]+\.[\w.]+/)?.[0] ?? ''

  // ── LinkedIn — only match proper profile URLs ─────────────────────────────
  const linkedinMatch = raw.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w\-]{2,50})/i)
  const linkedin = linkedinMatch ? `linkedin.com/in/${linkedinMatch[1]}` : ''

  // ── Location — search only in the first 8 header lines ───────────────────
  const headerLines = lines.slice(0, 8).join(' ')
  const LOC_CITIES = [
    'Vancouver','Toronto','Ottawa','Calgary','Montreal','Edmonton',
    'New York','San Francisco','Seattle','Boston','Austin','Chicago','Los Angeles','New Jersey',
    'Baltimore','Washington','Houston','Dallas','Atlanta','Miami','Denver',
    'Bengaluru','Bangalore','Mumbai','Hyderabad','Chennai','Pune','Gurugram','Noida',
    'Delhi','Kolkata','Ahmedabad','Jaipur','Kochi','Indore','Chandigarh',
  ]
  const LOC_REGIONS = ['BC','ON','QC','AB','NY','CA','TX','WA','IL','MD','NJ']
  const LOC_COUNTRIES = ['India','USA','United States','UK','Canada','Singapore','Australia','Remote']
  let location = ''
  // Try "City, Region/Country" first
  for (const city of LOC_CITIES) {
    const re = new RegExp(`${city}[,\\s]+([A-Z]{2}|${LOC_COUNTRIES.join('|')})`, 'i')
    const m = headerLines.match(re)
    if (m) { location = m[0].trim(); break }
  }
  // Fallback: just a city name in header
  if (!location) {
    for (const city of LOC_CITIES) {
      if (headerLines.toLowerCase().includes(city.toLowerCase())) { location = city; break }
    }
  }
  // Fallback: country only
  if (!location) {
    for (const country of LOC_COUNTRIES) {
      if (headerLines.toLowerCase().includes(country.toLowerCase())) { location = country; break }
    }
  }
  // Ignore US state codes standing alone (false positives like "BC" in company names)
  if (LOC_REGIONS.includes(location)) location = ''

  // ── Name ─────────────────────────────────────────────────────────────────
  const name = lines.find(l => {
    if (l.includes('@') || l.includes('http') || l.includes('|') || l.includes('·') || l.includes('•')) return false
    if (/^\+?\d/.test(l)) return false
    if (/linkedin|resume|curriculum|vitae/i.test(l)) return false
    const words = l.split(/\s+/)
    return words.length >= 2 && words.length <= 4 &&
      words.every(w => /^[A-Z][a-zA-Z'-]{1,}$/.test(w))
  }) ?? lines[0] ?? ''

  // ── Section splitter ──────────────────────────────────────────────────────
  const SECTION_RE: Record<string, RegExp> = {
    summary:    /^(summary|profile|about me|objective|professional summary|career objective|personal statement)/i,
    skills:     /^(skills|core skills|technical skills|competencies|key skills|areas of expertise|tools & technologies)/i,
    experience: /^(experience|work experience|employment|professional experience|career history|work history)/i,
    education:  /^(education|academic|qualification|educational background)/i,
    additional: /^(additional information|additional|interests|certifications?|awards|volunteer|community service)/i,
  }
  const sections: Record<string, string[]> = { preamble: [] }
  let cur = 'preamble'
  for (const line of lines) {
    let matched = false
    for (const [key, re] of Object.entries(SECTION_RE)) {
      if (re.test(line) && line.length < 70) {
        cur = key; sections[key] = sections[key] ?? []; matched = true; break
      }
    }
    if (!matched) (sections[cur] ??= []).push(line)
  }
  const sec = (k: string) => sections[k] ?? []

  // ── Job title ─────────────────────────────────────────────────────────────
  const TITLE_RE = /\b(manager|designer|engineer|developer|analyst|consultant|lead|director|vp|head|architect|scientist|specialist|strategist|associate|intern|officer|coordinator|advisor|executive|president|founder|recruiter)\b/i
  const preamble = sec('preamble')
  const jobTitle = preamble.find(l =>
    l !== name && !l.includes('@') && !l.includes('http') && !l.match(/^\+?\d/) &&
    TITLE_RE.test(l) && l.length < 80
  ) ?? ''

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = sec('summary').filter(l => l.length > 30).join(' ')

  // ── Skills — multi-source extraction, priority order ─────────────────────
  const skillSet: string[] = []
  const addSkills = (csv: string) =>
    csv.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40 && !/^\d+$/.test(s)).forEach(s => skillSet.push(s))

  // 1. Explicit skills section (e.g. "SKILLS", "CORE SKILLS")
  for (const line of sec('skills')) {
    addSkills(line.replace(/^[•\-*▸◆→>]\s*/, '').replace(/[•▸◆]/g, ','))
  }

  // 2. "Tech Skills:" / "Technical Skills:" / "Tools:" labeled line anywhere in raw text
  const techLineMatch = raw.match(/(?:tech(?:nical)?\s+skills?|tools?\s*(?:&\s*technologies?)?)\s*[:：]\s*([^\n]{3,})/i)
  if (techLineMatch) addSkills(techLineMatch[1])

  // 3. Similar labeled lines inside the additional section
  for (const line of sec('additional')) {
    const m = line.match(/^(?:tech(?:nical)?\s+skills?|tools?|technologies)\s*[:：]\s*(.+)/i)
    if (m) addSkills(m[1])
  }

  // 4. Last resort: match from SKILL_POOL against document text
  if (skillSet.length === 0) {
    const lower = raw.toLowerCase()
    SKILL_POOL.filter(s => lower.includes(s)).forEach(s => skillSet.push(s))
  }

  // ── Work Experience ───────────────────────────────────────────────────────
  // Handles "Month YYYY – Month YYYY" and "YYYY – YYYY" date ranges
  const PERIOD_RE = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(\d{4})\s*[-–—]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(\d{4}|present|current|now|till date)/i
  const ORG_RE    = /\b(llc|inc|ltd|limited|pvt|private|corporation|corp|gmbh|consulting|solutions|technologies|services|group|associates)\b/i

  interface RawExp { title: string; company: string; period: string; bullets: string[] }
  const workExps: RawExp[] = []
  let curExp: Partial<RawExp> | null = null
  let pendingCompany = ''      // explicit company line seen before the title+date line
  let lastFlushedCompany = ''  // company of last flushed entry, for same-company multi-role inheritance

  const flushExp = () => {
    if (curExp?.title || curExp?.company) {
      if (curExp.company) lastFlushedCompany = curExp.company
      workExps.push({
        title:   curExp.title   ?? '',
        company: curExp.company ?? '',
        period:  curExp.period  ?? '',
        bullets: curExp.bullets?.length ? curExp.bullets : [''],
      })
    }
    curExp = null
    pendingCompany = ''
  }

  const expLines = sec('experience')
  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i]
    const isBullet  = /^[•\-*◆▸→>]\s/.test(line) || /^\d+\.\s/.test(line)
    const periodMatch = line.match(PERIOD_RE)
    const hasTitle  = TITLE_RE.test(line)
    const looksOrg  = ORG_RE.test(line) || (!hasTitle && !periodMatch && !isBullet && line.length < 60)

    if (isBullet) {
      if (curExp) curExp.bullets = [...(curExp.bullets ?? []), line.replace(/^[•\-*◆▸→>1-9.]\s*/, '').trim()]
    } else if (periodMatch) {
      // Extract the matched date range text
      const dateText = line.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|now|till date)/i)?.[0] ?? `${periodMatch[1]} — ${periodMatch[2]}`
      const period = dateText
      // Strip date from line to get the title/company text
      const rest = line.replace(dateText, '').replace(/[,·\t]+$/,'').trim()

      if (hasTitle && rest.length > 0) {
        // Pattern: "Title  Jun 2023 – March 2025" or "Title – Company Jun 2023 – March 2025"
        flushExp()
        // Check if title contains " – " (dash separating title and company) — ONLY if no pending company
        let titlePart = rest
        let companyPart = pendingCompany || lastFlushedCompany
        if (!pendingCompany) {
          const dashMatch = rest.match(/^([^–—\-]+?)\s+[–—\-]\s+(.+)$/)
          if (dashMatch) {
            titlePart = dashMatch[1].trim()
            companyPart = dashMatch[2].trim() || companyPart
          }
        }
        curExp = {
          title:   titlePart,
          company: companyPart,
          period,
          bullets: [],
        }
        pendingCompany = ''
      } else if (!curExp) {
        // Date line with no prior title — store and keep going
        flushExp()
        curExp = { company: pendingCompany || rest || lastFlushedCompany, period, bullets: [] }
        pendingCompany = ''
      } else {
        // Additional role at same company, or period for existing entry
        if (!curExp.period) {
          curExp.period = period
          if (rest && !curExp.title && rest.length > 1) curExp.title = rest
        } else {
          // Second role at same company
          flushExp()
          curExp = { title: rest || '', company: pendingCompany || lastFlushedCompany, period, bullets: [] }
          pendingCompany = ''
        }
      }
    } else if (!isBullet && line.length > 2 && line.length < 100 && !line.includes('@')) {
      const WX_LOC_RE = /^(new york|san francisco|los angeles|chicago|seattle|boston|austin|atlanta|miami|denver|toronto|vancouver|montreal|mumbai|bangalore|bengaluru|hyderabad|pune|delhi|noida|gurugram|chennai|kochi|baltimore|washington|lima|peru)[,\s]/i
      if (hasTitle) {
        // Title line without a date (date may follow on next line)
        flushExp()
        curExp = { title: line, company: pendingCompany || lastFlushedCompany, bullets: [] }
        pendingCompany = ''
      } else if (looksOrg && !curExp) {
        // Likely a company/org name — skip pure location lines
        if (!WX_LOC_RE.test(line.trim())) {
          // Strip location (handles both "Company, City" and "Company City" formats)
          pendingCompany = line.replace(/[\s,–\-]+(new york|san francisco|los angeles|chicago|seattle|boston|austin|atlanta|miami|denver|toronto|vancouver|montreal|mumbai|bangalore|bengaluru|hyderabad|pune|delhi|noida|gurugram|chennai|kochi|baltimore|washington|lima|peru|india|usa|canada|uk|singapore|bc|on|ny|ca|md|il|tx|wa)\b.*/i, '').trim()
          if (!pendingCompany) pendingCompany = line
        }
      } else if (curExp && !curExp.company && (curExp.bullets?.length ?? 0) === 0 && !WX_LOC_RE.test(line.trim()) && !hasTitle) {
        // Company name that appears after the title line (before bullets start)
        curExp.company = line
      } else if (curExp && (curExp.bullets?.length ?? 0) > 0 && !hasTitle) {
        // Wrapped bullet continuation — append to last bullet
        const bullets = curExp.bullets ?? []
        if (bullets.length > 0) {
          curExp.bullets = [...bullets.slice(0, -1), bullets[bullets.length - 1] + ' ' + line]
        }
      }
    }
  }
  flushExp()

  // ── Education ─────────────────────────────────────────────────────────────
  const DEGREE_RE   = /\b(b\.?tech|b\.?e\b|b\.?sc\b|m\.?tech|m\.?sc\b|mba|phd|ph\.d|bachelor|master|doctor|b\.des|m\.des|bca|mca|b\.com|m\.com|diploma|pgdm|bba|llb|llm|b\.arch|associate|honours|honors|certificate)\b/i
  const SCHOOL_RE   = /\b(university|college|institute|school|academy|polytechnic|iit|iim|nit|bits|nmims|johns\s+hop|harvard|stanford|wharton|columbia|yale|princeton|cornell|lse|insead|carey|business\s+school|technology|management|mukesh)\b/i
  const ACTIVITY_RE = /\b(president|co-president|delegate|volunteer|club|initiative|competition|council|team\s+leader|merit\s+list|honor\s+roll|clean\s+india|ambulance)\b/i
  const LOC_LINE_RE = /^(new york|san francisco|los angeles|chicago|seattle|boston|austin|atlanta|miami|denver|toronto|vancouver|montreal|mumbai|bangalore|bengaluru|hyderabad|pune|delhi|noida|gurugram|chennai|kochi|baltimore|washington|lima|peru)[,\s]/i

  interface RawEdu { degree: string; school: string; period: string }
  const edus: RawEdu[] = []
  let curEdu: Partial<RawEdu> | null = null

  const flushEdu = () => {
    if (curEdu && (curEdu.degree || curEdu.school)) {
      edus.push({ degree: curEdu.degree ?? '', school: curEdu.school ?? '', period: curEdu.period ?? '' })
    }
    curEdu = null
  }

  for (const line of sec('education')) {
    const periodFull = line.match(/(\d{4})\s*[-–—]\s*(\d{4}|present|current|now)/i)
    const singleYear = line.match(/\b(\d{4})\b/)
    const period = periodFull
      ? `${periodFull[1]} — ${periodFull[2].charAt(0).toUpperCase() + periodFull[2].slice(1)}`
      : (singleYear ? singleYear[1] : '')

    const hasDegree  = DEGREE_RE.test(line)
    const hasSchool  = SCHOOL_RE.test(line)
    const isActivity = ACTIVITY_RE.test(line) && !hasDegree && !hasSchool
    const isLocation = LOC_LINE_RE.test(line.trim())

    if (isActivity || isLocation) continue

    // Clean: strip year range + trailing city/region fragments
    // Strip location when preceded by comma or space at the end of line (after school name)
    const lineClean = line
      .replace(periodFull ? periodFull[0] : /\b\d{4}\b/, '')
      .replace(/\s+(?:,-?\s*)?(baltimore|new york|san francisco|los angeles|chicago|seattle|boston|austin|miami|denver|toronto|vancouver|montreal|mumbai|bengaluru|bangalore|hyderabad|pune|delhi|noida|gurugram|chennai|kochi|washington|lima|peru|india|usa|canada|uk|singapore|bc|on|ny|ca|md|il|tx|wa|maryland|california|texas|washington|illinois)\b.*/i, '')
      .replace(/[,·|\t]+$/, '')
      .trim()

    // Degree takes priority over school when both match (e.g. "B.Tech ... NMIMS club ...")
    if (hasSchool && !hasDegree) {
      flushEdu()
      curEdu = { school: lineClean || line.replace(/\s*\d{4}.*$/, '').trim(), period }
    } else if (hasDegree) {
      const degreeText = lineClean.replace(/:\s*.+$/, '').trim()
      if (curEdu && !curEdu.degree) {
        curEdu.degree = degreeText
        if (period && !curEdu.period) curEdu.period = period
      } else {
        flushEdu()
        curEdu = { degree: degreeText, period }
      }
    } else if (period && curEdu && !curEdu.period) {
      curEdu.period = period
    }
    // Descriptive/activity lines intentionally skipped
  }
  flushEdu()

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

async function enrichCompanyNames(rawText: string, parsedWorkExp: WorkExp[]): Promise<WorkExp[]> {
  if (parsedWorkExp.length === 0) return parsedWorkExp

  try {
    const res = await fetch('/api/enrich-company-names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: rawText, workExp: parsedWorkExp }),
    })

    if (!res.ok) return parsedWorkExp
    return await res.json()
  } catch {
    return parsedWorkExp
  }
}


interface ResumeIssue {
  category: 'urgent' | 'critical' | 'optional'
  section: 'impact' | 'brevity' | 'style' | 'personalInfo'
  sectionLabel: string
  title: string
  issue: string
  whyImportant: string
  howToImprove: string
  example?: { before: string; after: string }
}

interface ResumeAnalysisReport {
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS IMPROVEMENT' | 'POOR'
  summary: string
  issues: ResumeIssue[]
  urgentCount: number
  criticalCount: number
  optionalCount: number
}

async function generateResumeAnalysisReport(resumeText: string, jobDescription: string): Promise<ResumeAnalysisReport> {
  try {
    const res = await fetch('/api/analyze-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobDescription }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || `Server error: ${res.status}`)
    }

    return await res.json()
  } catch (err: any) {
    throw new Error(err.message || 'Failed to generate analysis report. Make sure the backend server is running on port 3001.')
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResumeBuilder() {
  const { user } = useAuth()

  // UI state
  const [saved, setSaved]               = useState(false)
  const [activeTab, setActiveTab]       = useState<'import' | 'jd' | 'analysis' | 'editor'>('import')
  const [importFile,    setImportFile]    = useState<File | null>(null)
  const [parsedResume,  setParsedResume]  = useState<ParsedResume | null>(null)
  const [parsing,       setParsing]       = useState(false)
  const [parsingStatus, setParsingStatus] = useState('')
  const [importError,   setImportError]   = useState('')
  const [dragOver,      setDragOver]      = useState(false)
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<Array<{ id: string; type: 'ats' | 'bullet' | 'skill' | 'summary'; original: string; suggested: string; section: string; accepted: boolean }>>([])
  const [showOptimizations, setShowOptimizations] = useState(false)
  const [originalResumeFile, setOriginalResumeFile] = useState<File | null>(null)
  const [resumeRawText, setResumeRawText] = useState('')
  const [analysisReport, setAnalysisReport] = useState<ResumeAnalysisReport | null>(null)
  const [analysisError, setAnalysisError] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const [appliedImprovements, setAppliedImprovements] = useState<Set<number>>(new Set())
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
  const [jobDesc, setJobDesc]   = useState('')
  const [analysed, setAnalysed] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [tailored, setTailored] = useState(false)
  const [keywords, setKeywords] = useState<{ found: string[]; missing: string[] }>({ found: [], missing: [] })

  // Resume fields (all blank initially, populated only from uploaded resume)
  const [name,     setName]     = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email,    setEmail]    = useState('')
  const [location, setLocation] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [summary,  setSummary]  = useState('')
  const [skills,   setSkills]   = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [workExp, setWorkExp]   = useState<WorkExp[]>([])
  const [openExp, setOpenExp] = useState<number | null>(null)
  const [education, setEducation] = useState<EduEntry[]>([])

  // Derived
  const resumeText = useMemo(() => [
    name, jobTitle, summary, skills.join(' '),
    ...workExp.flatMap(e => [e.title, e.company, ...e.bullets]),
    ...education.flatMap(e => [e.degree, e.school]),
  ].join(' '), [name, jobTitle, summary, skills, workExp, education])

  const atsScore   = useMemo(() => computeScore(keywords.found.length, keywords.found.length + keywords.missing.length, analysed, resumeText), [keywords, analysed, resumeText])
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

  // Enrich company names via backend
  useEffect(() => {
    if (!parsedResume || !resumeRawText || parsedResume.workExp.length === 0) return

    const enrichNames = async () => {
      try {
        const enriched = await enrichCompanyNames(resumeRawText, parsedResume.workExp)
        const updated = { ...parsedResume, workExp: enriched }
        setParsedResume(updated)
      } catch {
        // Silently skip if enrichment fails
      }
    }

    enrichNames()
  }, [parsedResume?.workExp.length, resumeRawText])

  // Auto-apply parsed resume data when a resume is uploaded
  useEffect(() => {
    if (!parsedResume) return
    const acceptedSuggestions = optimizationSuggestions.filter(s => s.accepted)
    let updatedParsedResume = { ...parsedResume }

    // Apply accepted optimization suggestions
    for (const sugg of acceptedSuggestions) {
      if (sugg.type === 'summary' && updatedParsedResume.summary === sugg.original) {
        updatedParsedResume.summary = sugg.suggested
      } else if (sugg.type === 'bullet') {
        updatedParsedResume.workExp = updatedParsedResume.workExp.map(exp => ({
          ...exp,
          bullets: exp.bullets.map(b => b === sugg.original ? sugg.suggested : b)
        }))
      } else if (sugg.type === 'skill') {
        updatedParsedResume.skills = updatedParsedResume.skills.map(s => s === sugg.original ? sugg.suggested : s)
      }
    }

    if (updatedParsedResume.name)     setName(updatedParsedResume.name)
    if (updatedParsedResume.email)    setEmail(updatedParsedResume.email)
    if (updatedParsedResume.location) setLocation(updatedParsedResume.location)
    if (updatedParsedResume.linkedin) setLinkedin(updatedParsedResume.linkedin)
    if (updatedParsedResume.jobTitle) setJobTitle(updatedParsedResume.jobTitle)
    if (updatedParsedResume.summary)  setSummary(updatedParsedResume.summary)
    if (updatedParsedResume.skills.length > 0) setSkills(updatedParsedResume.skills)
    if (updatedParsedResume.workExp.length > 0) { setWorkExp(updatedParsedResume.workExp); setOpenExp(updatedParsedResume.workExp[0].id) }
    if (updatedParsedResume.education.length > 0) setEducation(updatedParsedResume.education)
  }, [parsedResume, optimizationSuggestions])

  // Handlers
  const handleAnalyse = async () => {
    if (!jobDesc.trim()) return
    if (!resumeRawText) {
      setAnalysisError('Please upload a resume first')
      return
    }
    setAnalysing(true)
    setAnalysisError('')
    try {
      const fallback = `${jobTitle} role. Requirements: UX Research, Figma, Design Systems, Prototyping, Stakeholder Management, Data Analysis, A/B Testing, Cross-functional, Roadmap, User Research, Product Strategy, Agile, Metrics.`
      const jd = jobDesc.trim() || fallback
      const kws = extractJDKeywords(jd)
      setKeywords(splitKeywords(kws, resumeRawText))

      // Generate analysis report
      try {
        setParsingStatus('Generating analysis report…')
        const report = await generateResumeAnalysisReport(resumeRawText, jd)
        setAnalysisReport(report)
        setActiveTab('analysis')
        setParsingStatus('')
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to generate analysis. Make sure the backend server is running on port 3001.'
        console.error('Analysis failed:', err)
        setAnalysisError(errorMsg)
        setParsingStatus('')
      }

      setAnalysed(true)
    } finally {
      setAnalysing(false)
    }
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
    setParsingStatus('')
    setParsing(true)
    setOptimizationSuggestions([])
    setShowOptimizations(false)
    try {
      const text = await extractTextFromFile(file)
      if (!text.trim()) throw new Error('Could not read any text from this file. Try a different format.')

      // Store original file and text
      setOriginalResumeFile(file)
      setResumeRawText(text)

      // Parse for basic metadata only
      const result = parseResumeText(text)
      setParsedResume(result)

      // Auto-navigate to Job Target tab after successful import
      setTimeout(() => setActiveTab('jd'), 800)
    } catch (err: any) {
      setImportError(err.message ?? 'Failed to read file. Please try a PDF, DOCX, or TXT.')
      setImportFile(null)
      setParsingStatus('')
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
    let updatedParsedResume = { ...parsedResume }

    // Apply accepted optimization suggestions
    const acceptedSuggestions = optimizationSuggestions.filter(s => s.accepted)
    for (const sugg of acceptedSuggestions) {
      if (sugg.type === 'summary' && updatedParsedResume.summary === sugg.original) {
        updatedParsedResume.summary = sugg.suggested
      } else if (sugg.type === 'bullet') {
        updatedParsedResume.workExp = updatedParsedResume.workExp.map(exp => ({
          ...exp,
          bullets: exp.bullets.map(b => b === sugg.original ? sugg.suggested : b)
        }))
      } else if (sugg.type === 'skill') {
        updatedParsedResume.skills = updatedParsedResume.skills.map(s => s === sugg.original ? sugg.suggested : s)
      }
    }

    if (updatedParsedResume.name)     setName(updatedParsedResume.name)
    if (updatedParsedResume.email)    setEmail(updatedParsedResume.email)
    if (updatedParsedResume.location) setLocation(updatedParsedResume.location)
    if (updatedParsedResume.linkedin) setLinkedin(updatedParsedResume.linkedin)
    if (updatedParsedResume.jobTitle) setJobTitle(updatedParsedResume.jobTitle)
    if (updatedParsedResume.summary)  setSummary(updatedParsedResume.summary)
    if (updatedParsedResume.skills.length > 0) setSkills(updatedParsedResume.skills)
    if (updatedParsedResume.workExp.length > 0) { setWorkExp(updatedParsedResume.workExp); setOpenExp(updatedParsedResume.workExp[0].id) }
    if (updatedParsedResume.education.length > 0) setEducation(updatedParsedResume.education)
    setParsedResume(null)
    setImportFile(null)
    setOptimizationSuggestions([])
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
          {analysisReport && (
            <button className={`rb-tab${activeTab === 'analysis' ? ' active' : ''}`} onClick={() => setActiveTab('analysis')}>
              <IconSparkle size={13} /> Analysis
            </button>
          )}
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
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                        {parsingStatus ? parsingStatus : 'Reading your resume…'}
                      </div>
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
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#15803D', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ✅ Resume parsed successfully
                    {parsedResume.aiUsed && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.2)', color: '#059669' }}>
                        ✨ AI-enhanced
                      </span>
                    )}
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

                {/* Optimization suggestions */}
                {showOptimizations && optimizationSuggestions.length > 0 && (
                  <>
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E40AF', marginBottom: 8 }}>
                        💡 {optimizationSuggestions.length} ATS Optimization Suggestions
                      </div>
                      <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.5 }}>
                        Click to accept improvements to your resume. All accepted changes will be applied.
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto', marginBottom: 8 }}>
                      {optimizationSuggestions.map((sugg) => (
                        <div key={sugg.id} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: sugg.accepted ? '#F0FDF4' : 'var(--bg-soft)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {sugg.section} — {sugg.type}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 4, lineHeight: 1.4 }}>
                            <strong>Before:</strong> {sugg.original.substring(0, 80)}{sugg.original.length > 80 ? '...' : ''}
                          </div>
                          <div style={{ fontSize: 12, color: '#059669', marginBottom: 8, lineHeight: 1.4 }}>
                            <strong>After:</strong> {sugg.suggested.substring(0, 80)}{sugg.suggested.length > 80 ? '...' : ''}
                          </div>
                          <button
                            onClick={() => {
                              setOptimizationSuggestions(prev => prev.map(s => s.id === sugg.id ? { ...s, accepted: !s.accepted } : s))
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: sugg.accepted ? '#10B981' : 'var(--border)',
                              color: sugg.accepted ? 'white' : 'var(--text-mute)',
                              transition: 'all 0.2s'
                            }}
                          >
                            {sugg.accepted ? '✓ Accepted' : '+ Accept'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="rb-tailor-btn" style={{ border: 'none' }} onClick={handleApplyParsed}>
                    <IcoEditPen size={13} /> {showOptimizations ? 'Apply Suggestions & Edit' : 'Edit Resume'} →
                  </button>
                  <button
                    onClick={() => { setParsedResume(null); setOptimizationSuggestions([]) }}
                    style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-mute)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    ← Try again with different file
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── JOB TARGET TAB ─── */}
        {activeTab === 'jd' && (
          <div className="rb-tab-content">
            {analysisError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 12.5, display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{analysisError}</span>
              </div>
            )}
            {!analysed ? (
              <>
                <div>
                  <h2 className="builder-title" style={{ fontSize: 17, marginBottom: 4 }}>Target a Job</h2>
                  <p className="builder-sub">Paste the job description to get a live ATS score and tailor your resume to the role.</p>
                </div>

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
                    <div className="ats-kw-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>MISSING — CLICK TO ADD <span className="ats-kw-count bad">{keywords.missing.length}</span></span>
                      <button
                        onClick={() => keywords.missing.forEach(kw => addMissingKw(kw))}
                        style={{
                          background: 'var(--accent)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Add All
                      </button>
                    </div>
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

        {/* ─── ANALYSIS TAB ─── */}
        {activeTab === 'analysis' && analysisReport && (
          <div className="rb-tab-content" style={{ gap: 16 }}>

            {/* Grade Card */}
            <div style={{
              background: 'linear-gradient(135deg, var(--blue-50), var(--blue-100))',
              border: '1px solid var(--blue-200)',
              borderRadius: 12,
              padding: '20px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {analysisReport.grade}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
                {analysisReport.status}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 8 }}>
                {analysisReport.summary}
              </div>
            </div>

            {/* Issue Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
            }}>
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '12px 10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626' }}>
                  {analysisReport.urgentCount}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#7F1D1D', marginTop: 2 }}>
                  Urgent Fix
                </div>
              </div>
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 8,
                padding: '12px 10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>
                  {analysisReport.criticalCount}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#92400E', marginTop: 2 }}>
                  Critical Fix
                </div>
              </div>
              <div style={{
                background: '#DBEAFE',
                border: '1px solid #93C5FD',
                borderRadius: 8,
                padding: '12px 10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#2563EB' }}>
                  {analysisReport.optionalCount}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1E40AF', marginTop: 2 }}>
                  Optional Fix
                </div>
              </div>
            </div>

            {/* Issues by section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['impact', 'brevity', 'style', 'personalInfo'].map(section => {
                const sectionIssues = analysisReport.issues.filter(i => i.section === section)
                if (sectionIssues.length === 0) return null

                const sectionLabels: Record<string, string> = {
                  impact: 'Impact & Achievements',
                  brevity: 'Brevity & Effectiveness',
                  style: 'Style & Sections',
                  personalInfo: 'Personal Info',
                }

                return (
                  <div key={section} style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      background: 'var(--bg-soft)',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border)',
                      fontWeight: 600,
                      fontSize: 13,
                      color: 'var(--text)',
                    }}>
                      {sectionLabels[section]}
                    </div>

                    {sectionIssues.map((issue, idx) => {
                      const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
                        urgent: { bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626' },
                        critical: { bg: '#FEF3C7', border: '#FCD34D', text: '#D97706' },
                        optional: { bg: '#DBEAFE', border: '#93C5FD', text: '#2563EB' },
                      }
                      const colors = categoryColors[issue.category]

                      return (
                        <div key={idx} style={{
                          padding: '12px 14px',
                          borderBottom: idx < sectionIssues.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                          }}>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: colors.bg,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                            }}>
                              {issue.category === 'urgent' ? '⚠️' : issue.category === 'critical' ? '⚡' : '•'} {issue.category.replace('urgent', 'URGENT').replace('critical', 'CRITICAL').replace('optional', 'OPTIONAL')}
                            </span>
                          </div>

                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
                            {issue.title}
                          </div>

                          <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 8, lineHeight: 1.4 }}>
                            {issue.issue}
                          </div>

                          <div style={{
                            fontSize: 11,
                            color: 'var(--text-mute)',
                            background: 'var(--bg-soft)',
                            borderLeft: `3px solid ${colors.text}`,
                            padding: '8px 10px',
                            borderRadius: 4,
                            marginBottom: 8,
                          }}>
                            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Why This Matters:</div>
                            {issue.whyImportant}
                          </div>

                          <div style={{
                            fontSize: 11,
                            color: 'var(--text-mute)',
                            background: 'var(--bg-soft)',
                            borderLeft: '3px solid var(--text-soft)',
                            padding: '8px 10px',
                            borderRadius: 4,
                            marginBottom: issue.example ? 8 : 0,
                          }}>
                            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>How to Improve:</div>
                            {issue.howToImprove}
                          </div>

                          {issue.example && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              fontSize: 11,
                            }}>
                              <div style={{
                                background: '#FEF2F2',
                                border: '1px solid #FCA5A5',
                                borderRadius: 6,
                                padding: '8px 10px',
                              }}>
                                <div style={{ fontWeight: 600, color: '#DC2626', marginBottom: 4 }}>Before:</div>
                                <div style={{ color: 'var(--text-soft)', fontFamily: 'monospace', fontSize: 10 }}>
                                  "{issue.example.before}"
                                </div>
                              </div>
                              <div style={{
                                background: '#F0FDF4',
                                border: '1px solid #86EFAC',
                                borderRadius: 6,
                                padding: '8px 10px',
                              }}>
                                <div style={{ fontWeight: 600, color: '#16A34A', marginBottom: 4 }}>After:</div>
                                <div style={{ color: 'var(--text-soft)', fontFamily: 'monospace', fontSize: 10 }}>
                                  "{issue.example.after}"
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => {
                setShowExportModal(true)
                setAppliedImprovements(new Set())
              }}
              style={{
                width: '100%',
                padding: '9px 0',
                borderRadius: 8,
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <IcoEditPen size={13} /> Start Improving
            </button>
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
              </div>
            </div>

            <div>
              <div className="form-section-head"><IconDoc size={14} /> Resume Text</div>
              <p style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 8 }}>Edit your resume directly. Your original formatting, bullets, and sections are preserved.</p>
              <textarea
                className="f-textarea"
                value={resumeRawText}
                onChange={e => setResumeRawText(e.target.value)}
                rows={35}
                style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}
              />
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
          {originalResumeFile ? (
            <div className="template-tag">📄 <strong>{originalResumeFile.name.toUpperCase()}</strong></div>
          ) : (
            <div className="template-tag">TEMPLATE: <strong>{templateName.toUpperCase()}</strong></div>
          )}

          {!originalResumeFile && (
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
          )}

          {!originalResumeFile && (
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
          )}
        </div>

        {/* Resume Document */}
        <div className="resume-preview">
          {!resumeRawText ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-mute)', textAlign: 'center', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>📄 Please upload your resume</div>
              <div style={{ fontSize: 13 }}>Your resume preview will appear here once uploaded</div>
            </div>
          ) : (
            <div className="resume-doc" style={{ fontFamily: resumeFont, transform: `scale(${zoom / 100})`, transformOrigin: 'top center', whiteSpace: 'pre-wrap', wordWrap: 'break-word', padding: '40px', background: 'white', color: '#374151', fontSize: '11px', lineHeight: '1.6' }}>
              {resumeRawText}
            </div>
          )}
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

        {/* ─── EXPORT IMPROVEMENTS MODAL ─── */}
        {showExportModal && analysisReport && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            fontFamily: 'inherit',
          }}>
            <div style={{
              background: 'white',
              borderRadius: 12,
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            }}>
              {/* Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1f2937' }}>All Improvements</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#6b7280' }}>
                    Applied: {appliedImprovements.size} / {analysisReport?.issues.length || 0}
                  </p>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 24,
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: 0,
                  }}
                >
                  <IcoX size={18} />
                </button>
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '20px',
              }}>
                {/* Group by section */}
                {['personalInfo', 'impact', 'brevity', 'style'].map(section => {
                  const sectionIssues = analysisReport.issues.filter(issue => issue.section === section)
                  if (sectionIssues.length === 0) return null

                  const sectionLabel = {
                    personalInfo: 'Personal Information',
                    impact: 'Impact & Accomplishments',
                    brevity: 'Clarity & Brevity',
                    style: 'Grammar & Professional Tone',
                  }[section] || section

                  return (
                    <div key={section} style={{ marginBottom: 24 }}>
                      <h3 style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#1f2937',
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <span style={{
                          display: 'inline-block',
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: '#3b82f6',
                        }}></span>
                        {sectionLabel}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {sectionIssues.map((issue, idx) => (
                          <div key={idx} style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            padding: 12,
                            background: '#f9fafb',
                          }}>
                            <div style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#6b7280',
                              marginBottom: 6,
                              display: 'flex',
                              gap: 8,
                              alignItems: 'center',
                            }}>
                              <span style={{
                                display: 'inline-block',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: issue.category === 'urgent' ? '#ef4444' : issue.category === 'critical' ? '#f97316' : '#84cc16',
                              }}></span>
                              {issue.category.toUpperCase()} — {issue.title}
                            </div>
                            <p style={{
                              fontSize: 12,
                              color: '#6b7280',
                              margin: '6px 0',
                              lineHeight: 1.4,
                            }}>
                              {issue.issue}
                            </p>
                            {issue.example && issue.example.before && issue.example.after && (
                              <div style={{
                                marginTop: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                              }}>
                                <div style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fca5a5',
                                  borderRadius: 6,
                                  padding: '8px 10px',
                                  fontSize: 11,
                                }}>
                                  <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Before:</div>
                                  <div style={{
                                    color: '#7f1d1d',
                                    fontFamily: 'monospace',
                                    fontSize: 10,
                                    wordBreak: 'break-word',
                                  }}>
                                    {issue.example.before}
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (issue.example) navigator.clipboard.writeText(issue.example.before)
                                      alert('Copied to clipboard!')
                                    }}
                                    style={{
                                      marginTop: 6,
                                      padding: '4px 8px',
                                      fontSize: 10,
                                      background: '#dc2626',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                      fontWeight: 500,
                                    }}
                                  >
                                    Copy
                                  </button>
                                </div>
                                <div style={{
                                  background: '#f0fdf4',
                                  border: '1px solid #86efac',
                                  borderRadius: 6,
                                  padding: '8px 10px',
                                  fontSize: 11,
                                }}>
                                  <div style={{ fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>After:</div>
                                  <div style={{
                                    color: '#15803d',
                                    fontFamily: 'monospace',
                                    fontSize: 10,
                                    wordBreak: 'break-word',
                                  }}>
                                    {issue.example.after}
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                    <button
                                      onClick={() => {
                                        if (issue.example) navigator.clipboard.writeText(issue.example.after)
                                        alert('Copied to clipboard!')
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: '4px 8px',
                                        fontSize: 10,
                                        background: '#16a34a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                      }}
                                    >
                                      Copy
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (analysisReport && parsedResume && issue.example) {
                                          const before = issue.example.before
                                          const after = issue.example.after
                                          let improved = { ...parsedResume }

                                          // Apply this specific replacement
                                          if (improved.workExp) {
                                            improved.workExp = improved.workExp.map(exp => ({
                                              ...exp,
                                              bullets: (exp.bullets || []).map(bullet =>
                                                bullet.includes(before) ? bullet.replace(before, after) : bullet
                                              ),
                                              title: exp.title?.includes(before)
                                                ? exp.title.replace(before, after)
                                                : exp.title
                                            }))
                                          }
                                          if (improved.education) {
                                            improved.education = improved.education.map(edu => ({
                                              ...edu,
                                              school: edu.school?.includes(before)
                                                ? edu.school.replace(before, after)
                                                : edu.school,
                                              degree: edu.degree?.includes(before)
                                                ? edu.degree.replace(before, after)
                                                : edu.degree
                                            }))
                                          }
                                          if (improved.summary?.includes(before)) {
                                            improved.summary = improved.summary.replace(before, after)
                                          }
                                          if (improved.skills) {
                                            improved.skills = improved.skills.map(skill =>
                                              skill.includes(before) ? skill.replace(before, after) : skill
                                            )
                                          }

                                          setParsedResume(improved)
                                          setAppliedImprovements(prev => new Set([...prev, idx]))
                                        }
                                      }}
                                      disabled={appliedImprovements.has(idx)}
                                      style={{
                                        flex: 1,
                                        padding: '4px 8px',
                                        fontSize: 10,
                                        background: appliedImprovements.has(idx) ? '#9ca3af' : '#059669',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 4,
                                        cursor: appliedImprovements.has(idx) ? 'not-allowed' : 'pointer',
                                        fontWeight: 500,
                                        opacity: appliedImprovements.has(idx) ? 0.7 : 1,
                                      }}
                                    >
                                      {appliedImprovements.has(idx) ? '✓ Applied' : 'Apply'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
              }}>
                <button
                  onClick={() => {
                    const text = analysisReport.issues
                      .map(issue => `${issue.sectionLabel} > ${issue.category.toUpperCase()}\n${issue.title}\n${issue.issue}\n${issue.example ? `Before: "${issue.example.before}"\nAfter: "${issue.example.after}"` : ''}`)
                      .join('\n\n---\n\n')
                    const blob = new Blob([text], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'resume-improvements.txt'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    background: '#e5e7eb',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <IconDownload size={13} /> Download as TXT
                </button>
                <button
                  onClick={() => {
                    setShowExportModal(false)
                    setActiveTab('editor')
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Continue to Editor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
