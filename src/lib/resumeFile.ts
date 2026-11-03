import * as pdfjs from 'pdfjs-dist'
import mammoth from 'mammoth'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { supabase } from './supabaseClient'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

// Reads the text out of an uploaded resume (PDF, DOCX or TXT). Shared by the Resume Builder and Find Jobs.
export interface ExtractResult { text: string; linkMap: Record<string, string> }

export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'pdf') {
    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise
    let text = ''
    const linkMap: Record<string, string> = {}

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()

      // Build list of text items with positions for link matching
      const textItems: Array<{ str: string; x: number; y: number; w: number; h: number }> = []
      let lastY: number | null = null
      for (const item of content.items as any[]) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 3) text += '\n'
        text += item.str
        lastY = item.transform[5]
        if (item.str.trim()) {
          textItems.push({
            str:  item.str,
            x:    item.transform[4],
            y:    item.transform[5],
            w:    item.width  ?? 0,
            h:    item.height ?? 10,
          })
        }
      }
      text += '\n'

      // Extract all hyperlink annotations and map to display text
      const annotations = await page.getAnnotations()
      for (const ann of annotations as any[]) {
        const url: string = ann.url || ann.unsafeUrl || ''
        if (!url) continue
        const [ax1, ay1, ax2, ay2] = ann.rect as number[]

        // Collect all text items whose centre falls inside the annotation rect
        const matched = textItems.filter(t => {
          const cx = t.x + t.w / 2
          const cy = t.y + t.h / 2
          return cx >= ax1 - 4 && cx <= ax2 + 4 && cy >= ay1 - 4 && cy <= ay2 + 4
        })
        const displayText = matched.map(t => t.str).join('').trim()

        if (displayText) {
          linkMap[displayText] = url
        }
        // Always capture LinkedIn via its URL pattern too (in case text matching misses it)
        if (/linkedin\.com\/in\//i.test(url) && !text.includes('linkedin.com/in/')) {
          text = url + '\n' + text
        }
      }
    }
    return { text, linkMap }
  }

  if (ext === 'docx' || ext === 'doc') {
    const buf = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buf })
    return { text: result.value, linkMap: {} }
  }

  if (ext === 'txt') {
    return { text: await file.text(), linkMap: {} }
  }

  throw new Error(`Unsupported file type: .${ext}. Please upload a PDF, DOCX, or TXT file.`)
}

/**
 * Keeps the person's latest resume text on their job profile so Find Jobs can score listings
 * against it without a second upload. Touches only the resume column; their role and city stay.
 */
export async function saveResumeForMatching(userId: string, text: string): Promise<boolean> {
  const { error } = await (supabase as any).from('job_profiles').upsert({
    user_id: userId,
    resume_text: text.slice(0, 20000),
    updated_at: new Date().toISOString(),
  })
  return !error
}
