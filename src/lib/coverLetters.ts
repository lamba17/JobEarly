export type Tone = 'formal' | 'friendly' | 'bold'

export interface CoverLetter {
  id: string
  company: string
  role: string
  letter: string
  tone: Tone
  createdAt: string
}
