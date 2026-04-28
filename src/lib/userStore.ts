export interface ResumeDoc {
  title: string
  savedAt: string
  atsScore: number
}

export interface UserData {
  resumes: number
  jobsApplied: number
  outreach: number
  recentDocs: ResumeDoc[]
}

const key = (email: string) => `je-data-${email}`

const defaults: UserData = { resumes: 0, jobsApplied: 0, outreach: 0, recentDocs: [] }

export function getUserData(email: string): UserData {
  try {
    const raw = localStorage.getItem(key(email))
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
  } catch {
    return { ...defaults }
  }
}

export function setUserData(email: string, data: UserData): void {
  localStorage.setItem(key(email), JSON.stringify(data))
}

export function addResume(email: string, title: string, atsScore: number): void {
  const data = getUserData(email)
  const doc: ResumeDoc = { title, savedAt: new Date().toISOString(), atsScore }
  setUserData(email, {
    ...data,
    resumes: data.resumes + 1,
    recentDocs: [doc, ...data.recentDocs].slice(0, 10),
  })
}
