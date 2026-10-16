import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY env vars')
}

export const supabase = createClient<Database>(url, key)

// A password-reset link signs the user in and fires PASSWORD_RECOVERY exactly once while the client
// initialises, which is before any React component is listening. Record it here so /reset-password
// is only ever usable by someone who really arrived through a recovery link: being signed in is not
// enough (otherwise a signed-in user could set a new password without the current one).
const RECOVERY_KEY = 'je-password-recovery'
let recoveryInMemory = false

supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    recoveryInMemory = true
    try { sessionStorage.setItem(RECOVERY_KEY, '1') } catch { /* storage blocked: memory flag still works */ }
  }
  if (event === 'SIGNED_OUT') clearRecovery()
})

export function recoveryPending(): boolean {
  if (recoveryInMemory) return true
  try { return sessionStorage.getItem(RECOVERY_KEY) === '1' } catch { return false }
}

export function clearRecovery() {
  recoveryInMemory = false
  try { sessionStorage.removeItem(RECOVERY_KEY) } catch { /* ignore */ }
}
