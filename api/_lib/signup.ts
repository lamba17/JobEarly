// Emails sent when someone signs up: a welcome email to them, and a "new signup" alert to the team.
//
// There are two ways in, and neither trusts the request:
//
//  1. sendSignupEmails(email): the sign-up page fires this right after signUp, before the user has a
//     session. Instead of emailing whatever address it is given, it looks the address up in Supabase Auth
//     and only acts for an account created in the last 30 minutes that has not been welcomed yet.
//
//  2. sendSignupEmailsForSession(authHeader): a second chance. That first request is fire-and-forget from
//     the browser, so it can be lost (tab closed, phone switched apps). When a new user signs in and was
//     never welcomed, the app asks again, this time with their login token, so the server knows exactly
//     who it is. Only for accounts under 7 days old.
//
// Either way each account triggers the emails exactly once (the welcome_sent flag).
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { sendBrandedMail, mailerConfigured } from './mailer.js'
import { welcomeEmail, signupAlertEmail } from './emailTemplates.js'

const FRESH_WINDOW_MS = 30 * 60 * 1000
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
// The sign-up page's own request takes a few seconds; don't race it.
const SESSION_MIN_AGE_MS = 15 * 1000
const PAGE_SIZE = 200
const MAX_PAGES = 5

type Candidate = Pick<User, 'email' | 'created_at' | 'user_metadata'>

/** The account for `email`, but only if it is brand new and has not been welcomed yet. */
export function pickFreshSignup<T extends Candidate>(users: T[], email: string, now = Date.now()): T | null {
  const target = email.trim().toLowerCase()
  const user = users.find(u => u.email?.toLowerCase() === target)
  if (!user) return null
  if (now - new Date(user.created_at).getTime() > FRESH_WINDOW_MS) return null
  if (user.user_metadata?.welcome_sent) return null
  return user
}

/** For the signed-in retry: not welcomed yet, old enough that the sign-up request has finished, and still new. */
export function eligibleForSessionWelcome(user: Pick<User, 'created_at' | 'user_metadata'>, now = Date.now()): boolean {
  const age = now - new Date(user.created_at).getTime()
  return !user.user_metadata?.welcome_sent && age >= SESSION_MIN_AGE_MS && age <= SESSION_MAX_AGE_MS
}

export class SignupEmailError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function adminClient(): SupabaseClient | null {
  if (!mailerConfigured()) {
    console.warn('Signup emails skipped: GMAIL_USER / GMAIL_APP_PASSWORD not configured')
    return null
  }
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.warn('Signup emails skipped: SUPABASE_SERVICE_ROLE_KEY not configured')
    return null
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Sends the welcome email and the team alert, then marks the account as welcomed. */
async function deliver(db: SupabaseClient, user: User, knownTotal?: number): Promise<void> {
  const email = user.email as string
  const meta = (user.user_metadata ?? {}) as { name?: string; job_title?: string }
  const name = meta.name ?? ''
  const jobTitle = meta.job_title ?? ''

  let totalUsers = knownTotal
  if (totalUsers === undefined) {
    const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 1 })
    const total = (data as unknown as { total?: number } | null)?.total
    if (typeof total === 'number') totalUsers = total
  }

  // Both emails go out at the same time: each opens its own Gmail connection (~3 s each), and
  // doing them one after the other came close to the serverless time limit.
  const owner = process.env.GMAIL_USER
  const [welcome, alert] = await Promise.allSettled([
    sendBrandedMail(email, welcomeEmail({ firstName: name.split(' ')[0] || 'there' })),
    owner
      ? sendBrandedMail(owner, signupAlertEmail({ name, email, jobTitle, createdAt: new Date(user.created_at), totalUsers }))
      : Promise.resolve(false),
  ])
  // The alert is best-effort: it must never break signup.
  if (alert.status === 'rejected') console.error('Signup alert failed:', alert.reason)
  if (welcome.status === 'rejected') throw welcome.reason

  // Mark as welcomed so repeated requests for this account do nothing.
  const { error: markError } = await db.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, welcome_sent: true } })
  if (markError) console.error('Could not mark welcome_sent:', markError.message)
}

export async function sendSignupEmails(email: string): Promise<{ sent: boolean }> {
  const db = adminClient()
  if (!db) return { sent: false }

  let user: User | null = null
  let totalUsers: number | undefined
  for (let page = 1; page <= MAX_PAGES && !user; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error) throw error
    const total = (data as unknown as { total?: number }).total
    if (typeof total === 'number') totalUsers = total
    const target = email.trim().toLowerCase()
    const users = data.users as User[]
    const match = users.find(u => u.email?.toLowerCase() === target)
    if (match) user = pickFreshSignup([match], email)
    if (match || users.length < PAGE_SIZE) break
  }
  if (!user) return { sent: false }

  await deliver(db, user, totalUsers)
  return { sent: true }
}

export async function sendSignupEmailsForSession(authHeader: string): Promise<{ sent: boolean }> {
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!token || !url || !anon) throw new SignupEmailError(401, 'Please sign in again.')

  // Who is this? Ask Supabase, never believe the request.
  const { data: who, error: whoError } = await createClient(url, anon, { auth: { persistSession: false } }).auth.getUser(token)
  if (whoError || !who.user) throw new SignupEmailError(401, 'Please sign in again.')

  const db = adminClient()
  if (!db) return { sent: false }

  // Re-read the account with the service key so we see the real, current welcome_sent flag.
  const { data: full, error } = await db.auth.admin.getUserById(who.user.id)
  if (error || !full.user?.email) throw new SignupEmailError(404, 'Account not found.')
  if (!eligibleForSessionWelcome(full.user)) return { sent: false }

  await deliver(db, full.user)
  return { sent: true }
}
