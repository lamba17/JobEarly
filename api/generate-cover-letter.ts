import { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { fullName, currentRole, company, targetRole, jobDescription, experience, tone, previousLetter, refineInstruction } = req.body as {
    fullName: string
    currentRole?: string
    company: string
    targetRole: string
    jobDescription?: string
    experience?: string
    tone?: 'formal' | 'friendly' | 'bold'
    previousLetter?: string
    refineInstruction?: string
  }

  if (!fullName || !company || !targetRole) {
    return res.status(400).json({ error: 'Full name, company, and target role are required' })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' })
  }

  try {
    const client = new Anthropic({ apiKey })

    const toneGuidance = {
      formal: 'professional, traditional, and polished',
      friendly: 'warm, personable, and conversational while remaining professional',
      bold: 'confident, direct, and energetic',
    }[tone ?? 'formal'] ?? 'professional and polished'

    const prompt = refineInstruction && previousLetter
      ? `Here is a cover letter draft:
---
${previousLetter}
---
Revise it according to this instruction: "${refineInstruction}"

Return ONLY the revised letter text. No explanations, no markdown, no surrounding quotes.`
      : `You are an expert career coach writing a tailored, compelling cover letter for a job application. Avoid generic filler phrases and clichés like "I am writing to express my interest." Be specific and achievement-oriented.

Candidate name: ${fullName}
Candidate current role: ${currentRole || 'Not specified'}
Target company: ${company}
Target role: ${targetRole}
Desired tone: ${toneGuidance}

Candidate's relevant experience/background:
${experience || 'Not provided — write a strong, general letter based on the target role.'}

Job description:
${jobDescription || 'Not provided — write a strong letter tailored to the target role and company.'}

Write a complete, ready-to-send cover letter (3-4 paragraphs, under 350 words). Do not include a header, date, or address block — start directly with the salutation ("Dear Hiring Manager," or similar). End with a professional sign-off and the candidate's name.

Return ONLY the letter text. No explanations, no markdown, no surrounding quotes.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const letter = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    if (!letter) {
      return res.status(500).json({ error: 'Invalid response from Claude' })
    }

    res.status(200).json({ letter })
  } catch (error: any) {
    console.error('Error generating cover letter:', error)
    res.status(500).json({
      error: error?.message || 'Failed to generate cover letter',
    })
  }
}
