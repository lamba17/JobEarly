// Deep "should I apply?" score for one job against one resume. Pro only, checked here on the server.
import Anthropic from '@anthropic-ai/sdk'
import { authenticate, userIsPro, BillingError } from './billing.js'

export interface JobFit {
  score: number
  verdict: 'apply' | 'stretch' | 'skip'
  summary: string
  strengths: string[]
  gaps: string[]
  tip: string
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const list = (v: unknown, n: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, n).map(s => s.slice(0, 220)) : []

export async function scoreJobFit(authHeader: string | undefined, body: any): Promise<JobFit> {
  const user = await authenticate(authHeader)
  if (!(await userIsPro(user.id))) throw new BillingError(403, 'The detailed fit score is a Pro feature.')

  const resumeText = clean(body?.resumeText, 6000)
  const job = body?.job ?? {}
  const title = clean(job.title, 200)
  const company = clean(job.company, 200)
  const description = clean(job.description, 4000)
  if (resumeText.length < 100) throw new BillingError(400, 'Add your resume text first.')
  if (!title) throw new BillingError(400, 'Missing job details.')

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) throw new BillingError(503, 'AI scoring is not configured.')

  const prompt = `You are a candid recruiter. Judge how well this resume fits this job. Use ONLY what is written in the resume and the job text. Do not invent experience.

JOB: ${title} at ${company}
${description}

RESUME:
${resumeText}

Return ONLY valid JSON, no markdown:
{
  "score": 0-100 integer (90+ = strong fit, 70-89 = good, 50-69 = stretch, below 50 = poor),
  "verdict": "apply" | "stretch" | "skip",
  "summary": "one or two plain sentences",
  "strengths": ["up to 4 short points, each tied to something in the resume"],
  "gaps": ["up to 4 short points: required skills or experience the resume does not show"],
  "tip": "one concrete thing to change on the resume before applying"
}`

  const client = new Anthropic({ apiKey })
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  let parsed: any
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    throw new BillingError(502, 'Could not read the AI answer. Please try again.')
  }

  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)))
  const verdict = parsed.verdict === 'apply' || parsed.verdict === 'skip' ? parsed.verdict : 'stretch'
  return {
    score,
    verdict,
    summary: clean(parsed.summary, 400),
    strengths: list(parsed.strengths, 4),
    gaps: list(parsed.gaps, 4),
    tip: clean(parsed.tip, 300),
  }
}
