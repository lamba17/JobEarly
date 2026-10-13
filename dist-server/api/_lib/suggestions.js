// Shared by the Vercel function (api/analyze-resume.ts) and the local server (server.ts)
// so production and local development give the same kind of suggestions.
export const EXAMPLE_RULES = `Rules for every "example":
- "before" must be ONE complete bullet or line copied word-for-word from the resume.
- "after" must be the complete rewritten version of that same bullet, starting with a capital letter or action verb, that can directly replace it.
- "after" must be text the candidate could paste straight into the resume. It must never be advice, an instruction, or a description of what to do (no "Add…", "Consider…", "Clarify…").
- Never use "..." or "…" at the start or end of either value, and never abbreviate or truncate them.
- NEVER invent facts. Do not add numbers, percentages, dollar amounts, team sizes, years of experience, tools, employers or dates that are not already in the resume. Reuse figures from the resume only. Where a number would strengthen the bullet, write a placeholder such as [X%] or [number] for the candidate to fill in.`;
const ELLIPSIS_EDGE = /^\s*["'“]?\s*(\.\.\.|…)|(\.\.\.|…)\s*["'”]?\s*$/;
const NUMBER = /\d[\d,]*(?:\.\d+)?/g;
const core = (n) => n.replace(/,/g, '');
// Replaces numbers that do not appear in the resume with [X], so a rewrite can never
// silently claim figures the candidate never gave us (they see [X] and fill in the truth).
export function maskInventedNumbers(after, resumeText) {
    const known = new Set((resumeText.match(NUMBER) || []).map(core));
    let masked = 0;
    const text = after.replace(NUMBER, m => {
        if (known.has(core(m)))
            return m;
        masked++;
        return '[X]';
    });
    return { text, masked };
}
// A suggestion that starts or ends with an ellipsis is a cut-off fragment and cannot replace a
// resume bullet, so drop it instead of showing something the user would apply.
export function sanitizeExample(example, resumeText) {
    if (!example)
        return undefined;
    const before = String(example.before || '').trim().slice(0, 600);
    const rawAfter = String(example.after || '').trim().slice(0, 600);
    if (!before || !rawAfter || ELLIPSIS_EDGE.test(rawAfter) || ELLIPSIS_EDGE.test(before))
        return undefined;
    const { text: after } = maskInventedNumbers(rawAfter, resumeText);
    return { before, after };
}
