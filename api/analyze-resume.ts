import { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

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

    const prompt = `Analyze resume against job description.

Resume: ${resumeText.slice(0, 2000)}

Job: ${jobDescription.slice(0, 1000)}

Output ONLY JSON with no markdown, text, or markdown code blocks:
{
  "grade": "A",
  "status": "EXCELLENT",
  "summary": "Brief summary",
  "issues": [{"category": "urgent", "section": "impact", "sectionLabel": "Impact & Accomplishments", "title": "Title", "issue": "Description", "whyImportant": "Why", "howToImprove": "How", "example": {"before": "before", "after": "after"}}],
  "urgentCount": 0,
  "criticalCount": 0,
  "optionalCount": 0
}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from markdown code blocks or raw JSON
    let jsonText = responseText.trim()

    // Try to extract from markdown code blocks first
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    // Remove any leading/trailing whitespace and markdown
    jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()

    // Try to find the JSON object if it's embedded in text
    const objectMatch = jsonText.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      jsonText = objectMatch[0]
    }

    const report = JSON.parse(jsonText)

    res.status(200).json(report)
  } catch (error: any) {
    console.error('Error analyzing resume:', error)
    res.status(500).json({
      error: error?.message || 'Failed to analyze resume',
    })
  }
}
