import { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

interface WorkExp {
  id: number
  title: string
  company: string
  period: string
  bullets: string[]
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { resumeText, workExp } = req.body as { resumeText: string; workExp: WorkExp[] }

  if (!resumeText || !workExp) {
    return res.status(400).json({ error: 'Missing resumeText or workExp' })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' })
  }

  try {
    const client = new Anthropic({ apiKey })

    const workExpList = workExp
      .map((exp, i) => `${i + 1}. Position: ${exp.title}, Company: ${exp.company}`)
      .join('\n')

    const prompt = `Extract company names from this resume.

Positions found:
${workExpList}

Resume:
${resumeText}

Output ONLY a JSON array with no markdown, no text, no comments. Just the array:
["Company 1", "Company 2"]`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
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

    // Try to find the JSON array if it's embedded in text
    const arrayMatch = jsonText.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      jsonText = arrayMatch[0]
    }

    const companyNames: string[] = JSON.parse(jsonText)

    const enrichedWorkExp: WorkExp[] = workExp.map((exp, i) => ({
      ...exp,
      company: companyNames[i] || exp.company,
    }))

    res.status(200).json(enrichedWorkExp)
  } catch (error: any) {
    console.error('Error enriching company names:', error)
    res.status(500).json({
      error: error?.message || 'Failed to enrich company names',
    })
  }
}
