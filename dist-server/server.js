import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});
const client = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});
// Endpoint for generating analysis report
app.post('/api/analyze-resume', async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;
        if (!resumeText || !jobDescription) {
            return res.status(400).json({ error: 'Resume text and job description are required' });
        }
        const prompt = `You are an expert resume coach. Analyze this resume and identify specific issues that need fixing to improve ATS compatibility and recruiter appeal. Return ONLY valid JSON:
{
  "grade": "A" | "B" | "C" | "D" | "F",
  "status": "EXCELLENT" | "GOOD" | "FAIR" | "NEEDS IMPROVEMENT" | "POOR",
  "summary": "brief overall assessment",
  "issues": [
    {
      "category": "urgent" | "critical" | "optional",
      "section": "impact" | "brevity" | "style" | "personalInfo",
      "sectionLabel": "Impact & Achievements" | "Brevity & Effectiveness" | "Style & Sections" | "Personal Info",
      "title": "short issue title",
      "issue": "detailed description of the problem",
      "whyImportant": "why this matters for ATS and recruiters",
      "howToImprove": "specific actionable guidance to fix it",
      "example": {
        "before": "weak example from resume",
        "after": "improved version"
      }
    }
  ]
}

URGENT FIX = Critical blocker (missing sections, wrong format, contact info issues)
CRITICAL FIX = Significant problem (weak achievements, poor structure, missing keywords from job)
OPTIONAL FIX = Nice-to-have improvements (wording, style, minor optimizations)

Resume text:
${resumeText}

Job description (for context):
${jobDescription}

Guidelines:
- Return 6-10 total issues
- Include at least 1 urgent, 1 critical, and 1 optional
- Be specific and actionable
- Include before/after examples for the most impactful issues
- Score should reflect overall quality (A=excellent, B=good, C=fair, D=poor, F=critical issues)`;
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
        });
        const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return res.status(500).json({ error: 'Invalid response from Claude' });
        }
        const report = JSON.parse(jsonMatch[0]);
        const result = {
            ...report,
            urgentCount: report.issues.filter((i) => i.category === 'urgent').length,
            criticalCount: report.issues.filter((i) => i.category === 'critical').length,
            optionalCount: report.issues.filter((i) => i.category === 'optional').length,
        };
        res.json(result);
    }
    catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze resume' });
    }
});
// Endpoint for company name enrichment
app.post('/api/enrich-company-names', async (req, res) => {
    try {
        const { resumeText, workExp } = req.body;
        if (!resumeText || !workExp) {
            return res.status(400).json({ error: 'Resume text and work experience are required' });
        }
        const prompt = `You are a resume parser expert. Extract the ACTUAL company names from this resume's work experience section.

For EACH work experience entry, find:
1. The company name (who they worked for)
2. The date period (when they worked)
3. The position/title (what they did)

Return ONLY valid JSON array with this exact format:
[
  {
    "position": 0,
    "company": "Microsoft",
    "period": "Jun 2023 – Mar 2025"
  }
]

Rules:
- Include ONLY real company names (proper organizations)
- Position is the index (0, 1, 2, ...) of the work entry
- Skip entries where you cannot identify a clear company name
- Do NOT include sectors like Retail, Finance, Technology

Resume:
${resumeText}`;
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }],
        });
        const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return res.json(workExp); // Return original if parsing fails
        }
        const extracted = JSON.parse(jsonMatch[0]);
        const updated = [...workExp];
        for (const item of extracted) {
            if (typeof item.position === 'number' && item.position >= 0 && item.position < updated.length && item.company) {
                const company = item.company.trim();
                const sectors = ['retail', 'finance', 'tech', 'consumer', 'manufacturing', 'services', 'software', 'consulting'];
                const isSector = sectors.some(s => company.toLowerCase().includes(s));
                if (company.length > 2 && !isSector) {
                    updated[item.position] = { ...updated[item.position], company };
                }
            }
        }
        res.json(updated);
    }
    catch (error) {
        console.error('Enrichment error:', error);
        res.status(500).json({ error: error.message || 'Failed to enrich company names' });
    }
});
// Endpoint for generating a tailored cover letter
app.post('/api/generate-cover-letter', async (req, res) => {
    try {
        const { fullName, currentRole, company, targetRole, jobDescription, experience, tone, previousLetter, refineInstruction } = req.body;
        if (!fullName || !company || !targetRole) {
            return res.status(400).json({ error: 'Full name, company, and target role are required' });
        }
        const toneGuidance = {
            formal: 'professional, traditional, and polished',
            friendly: 'warm, personable, and conversational while remaining professional',
            bold: 'confident, direct, and energetic',
        }[tone] ?? 'professional and polished';
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

Return ONLY the letter text. No explanations, no markdown, no surrounding quotes.`;
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        });
        const letter = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
        if (!letter) {
            return res.status(500).json({ error: 'Invalid response from Claude' });
        }
        res.json({ letter });
    }
    catch (error) {
        console.error('Cover letter generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate cover letter' });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`CLAUDE_API_KEY: ${process.env.CLAUDE_API_KEY ? '✓ Set' : '✗ Not set'}`);
});
