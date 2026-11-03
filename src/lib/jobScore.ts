// Instant, free "how well does my resume match this job?" score. It runs in the browser on the
// listing text, so every result on the page can be scored without any AI cost. Listings from some
// sources carry only a short description, so this is a guide; the Pro "Detailed fit" check reads the
// full job and gives the real verdict.

export interface QuickScore {
  score: number
  label: 'Strong match' | 'Good match' | 'Possible match' | 'Weak match'
  matched: string[]
  missing: string[]
}

const STOP = new Set(('a an and are as at be been but by can for from has have if in into is it its of on or our that the their ' +
  'them then there these they this to us was we were will with you your who what when where which while about across after all also ' +
  'any both each more most other such than very able etc per via within without work working role team company join looking ' +
  'responsible responsibilities requirements required experience years year skills ability strong excellent good great new ' +
  'including include ensure support using use used make help build building develop developing opportunity candidate position job ' +
  'plus preferred knowledge understanding must should would could including related relevant need needs own provide provides ' +
  'features feature full opportunities seeking looking ideal hire hiring day days time based well like get gets lead ' +
  'collaborate collaborates maintain maintains manage manages').split(' '))

// Kept as phrases because splitting them loses the meaning.
const PHRASES = ['machine learning', 'data science', 'data analysis', 'project management', 'product management', 'customer success',
  'business analysis', 'digital marketing', 'content marketing', 'social media', 'user experience', 'deep learning', 'node.js',
  'sales engineering', 'account management', 'supply chain', 'financial modelling', 'financial modeling', 'quality assurance',
  'human resources', 'talent acquisition', 'customer support', 'ui design', 'ux design', 'full stack', 'front end', 'back end',
  'cloud computing', 'natural language processing', 'computer vision', 'power bi', 'google analytics']

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').replace(/\s+/g, ' ')

// Treat "developer", "programmer" and "engineering" as one idea, then drop -ing/-ed/-s so
// "mentored" matches "mentor" and "APIs" matches "API".
const SAME: Record<string, string> = { developer: 'engineer', programmer: 'engineer', engineering: 'engineer', engineers: 'engineer', developers: 'engineer' }
function stem(w: string): string {
  if (SAME[w]) return SAME[w]
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3)
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1)
  return w
}

/** Weighted terms of a text, keyed by stem. `shown` remembers the original wording for display. */
function terms(text: string, shown: Map<string, string>): Map<string, number> {
  const t = norm(text)
  const out = new Map<string, number>()
  const bump = (k: string, n = 1) => out.set(k, (out.get(k) ?? 0) + n)
  for (const p of PHRASES) if (t.includes(p)) { bump(p, 2); shown.set(p, p) }
  for (const raw of t.split(' ')) {
    const w = raw.replace(/^\.+|\.+$/g, '')
    if (w.length < 3 || STOP.has(w) || /^\d+$/.test(w)) continue
    const k = stem(w)
    if (STOP.has(k)) continue
    if (!shown.has(k)) shown.set(k, w)
    bump(k)
  }
  return out
}

/** Score `job` against `resume`. Title words count triple because they say what the job really is. */
export function quickScore(resume: string, job: { title: string; description: string }): QuickScore {
  if (resume.trim().length < 80) return { score: 0, label: 'Weak match', matched: [], missing: [] }

  const shown = new Map<string, string>()
  const jobTerms = terms(job.description, shown)
  for (const [k, v] of terms(job.title, shown)) jobTerms.set(k, (jobTerms.get(k) ?? 0) + v * 3)

  // The 30 most emphasised job terms are the ones that matter for the match.
  const top = [...jobTerms.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)
  if (!top.length) return { score: 0, label: 'Weak match', matched: [], missing: [] }

  const have = norm(resume)
  const haveWords = new Set(have.split(' ').map(w => stem(w.replace(/^\.+|\.+$/g, ''))))
  const present = (term: string) => (term.includes(' ') ? have.includes(term) : haveWords.has(term))

  let got = 0, total = 0
  const matched: string[] = [], missing: string[] = []
  for (const [term, weight] of top) {
    total += weight
    const name = shown.get(term) ?? term
    if (present(term)) { got += weight; matched.push(name) } else missing.push(name)
  }

  // A resume rarely repeats 100% of a job ad, so 70% coverage is already an excellent match.
  const score = Math.max(0, Math.min(98, Math.round((got / total / 0.7) * 100)))
  const label = score >= 80 ? 'Strong match' : score >= 65 ? 'Good match' : score >= 45 ? 'Possible match' : 'Weak match'
  return { score, label, matched: matched.slice(0, 8), missing: missing.slice(0, 8) }
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#10B981'
  if (score >= 65) return '#3B82F6'
  if (score >= 45) return '#F59E0B'
  return '#6B7280'
}
