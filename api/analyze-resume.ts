import { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

function repairJson(raw: string): string {
  // 1. Extract the outermost JSON object
  const objStart = raw.indexOf('{')
  const objEnd = raw.lastIndexOf('}')
  if (objStart === -1 || objEnd === -1) throw new Error('No JSON object found')
  let text = raw.slice(objStart, objEnd + 1)

  // 2. Fix unescaped newlines/tabs inside JSON string values
  //    Walk character by character — only escape inside quoted strings
  let result = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (escaped) { result += ch; escaped = false; continue }
    if (ch === '\\') { escaped = true; result += ch; continue }
    if (ch === '"') { inString = !inString; result += ch; continue }
    if (inString) {
      if (ch === '\n') { result += '\\n'; continue }
      if (ch === '\r') { result += '\\r'; continue }
      if (ch === '\t') { result += '\\t'; continue }
    }
    result += ch
  }

  // 3. If JSON is truncated (open arrays/objects), close them
  const stack: string[] = []
  inString = false
  escaped = false
  for (const ch of result) {
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{' || ch === '[') stack.push(ch)
    if (ch === '}') { if (stack[stack.length - 1] === '{') stack.pop() }
    if (ch === ']') { if (stack[stack.length - 1] === '[') stack.pop() }
  }
  // Close any unclosed brackets
  while (stack.length) {
    const top = stack.pop()
    result += top === '{' ? '}' : ']'
  }

  return result
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { resumeText, jobDescription } = req.body

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: 'Missing resumeText or jobDescription' })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' })
  }

  try {
    const client = new Anthropic({ apiKey })

    const prompt = `Analyze resume vs job description. Find 5-8 specific improvements.

Resume (first 2000 chars):
${resumeText.slice(0, 2000)}

Job Description (first 1000 chars):
${jobDescription.slice(0, 1000)}

Return ONLY valid JSON with no markdown, no code blocks, no explanation. Keep "before" and "after" values SHORT (under 100 chars each) and escape any quotes inside them:
{
  "grade": "B",
  "status": "GOOD",
  "summary": "1-2 sentence overall assessment",
  "issues": [
    {
      "category": "urgent | critical | optional",
      "section": "impact | brevity | style | personalInfo | experience | skills | education | format",
      "sectionLabel": "Human-readable section name",
      "title": "Specific improvement title",
      "issue": "What is wrong",
      "whyImportant": "Why this matters",
      "howToImprove": "Specific actionable fix",
      "example": {
        "before": "Short excerpt from resume (under 100 chars)",
        "after": "Improved version (under 100 chars)"
      }
    }
  ],
  "urgentCount": 1,
  "criticalCount": 2,
  "optionalCount": 2
}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let jsonText = responseText.trim()

    // Strip markdown code fences if present
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) jsonText = fenceMatch[1].trim()
    jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()

    // Repair and parse
    let report
    try {
      report = JSON.parse(jsonText)
    } catch {
      // Try repairing common JSON issues
      const repaired = repairJson(jsonText)
      report = JSON.parse(repaired)
    }

    // Ensure required fields exist with safe defaults
    report.grade = report.grade || 'B'
    report.status = report.status || 'GOOD'
    report.summary = report.summary || 'Analysis complete.'
    report.issues = (report.issues || []).map((issue: any) => ({
      ...issue,
      example: issue.example ? {
        before: String(issue.example.before || '').slice(0, 200),
        after:  String(issue.example.after  || '').slice(0, 200),
      } : undefined,
    }))
    report.urgentCount   = report.urgentCount   ?? report.issues.filter((i: any) => i.category === 'urgent').length
    report.criticalCount = report.criticalCount ?? report.issues.filter((i: any) => i.category === 'critical').length
    report.optionalCount = report.optionalCount ?? report.issues.filter((i: any) => i.category === 'optional').length

    res.status(200).json(report)
  } catch (error: any) {
    console.error('Error analyzing resume:', error)
    res.status(500).json({
      error: error?.message || 'Failed to analyze resume',
    })
  }
}
