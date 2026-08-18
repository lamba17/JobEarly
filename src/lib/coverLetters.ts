export type Tone = 'formal' | 'friendly' | 'bold'

export interface CoverLetter {
  id: string
  company: string
  role: string
  letter: string
  tone: Tone
  createdAt: number
}

const key = (email?: string | null) => `je-coverletters-${email ?? 'guest'}`

export function loadCoverLetters(email?: string | null): CoverLetter[] {
  try {
    return JSON.parse(localStorage.getItem(key(email)) ?? '[]')
  } catch {
    return []
  }
}

export function saveCoverLetters(email: string | undefined | null, letters: CoverLetter[]): void {
  localStorage.setItem(key(email), JSON.stringify(letters))
}
