import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export interface User {
  id: string
  name: string
  email: string
  jobTitle: string
  claudeApiKey?: string
}

interface SignUpData {
  name: string
  email: string
  jobTitle: string
  password: string
}

interface AuthCtx {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (data: SignUpData) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  updateApiKey: (key: string) => Promise<void>
  updateProfile: (data: { name: string; jobTitle: string }) => Promise<string | null>
  changePassword: (currentPassword: string, newPassword: string) => Promise<string | null>
  requestPasswordReset: (email: string) => Promise<void>
  updatePasswordFromRecovery: (newPassword: string) => Promise<string | null>
}

const AuthContext = createContext<AuthCtx | null>(null)

async function loadUser(session: Session | null): Promise<User | null> {
  if (!session?.user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, job_title, claude_api_key')
    .eq('id', session.user.id)
    .single()

  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: profile?.name ?? '',
    jobTitle: profile?.job_title ?? '',
    claudeApiKey: profile?.claude_api_key ?? undefined,
  }
}

function authErrorMessage(message: string): string {
  if (message.toLowerCase().includes('invalid login credentials')) return 'Invalid email or password. Please try again.'
  if (message.toLowerCase().includes('user already registered')) return 'An account with this email already exists.'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = await loadUser(session)
      if (!cancelled) { setUser(u); setLoading(false) }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = await loadUser(session)
      if (!cancelled) setUser(u)
    })

    return () => { cancelled = true; listener.subscription.unsubscribe() }
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return authErrorMessage(error.message)
    return null
  }

  const signUp = async (data: SignUpData): Promise<{ error: string | null; needsEmailConfirmation: boolean }> => {
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name, job_title: data.jobTitle } },
    })
    if (error) return { error: authErrorMessage(error.message), needsEmailConfirmation: false }

    // Fire-and-forget: a welcome email failing should never block signup.
    fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, name: data.name }),
    }).catch(() => {})

    return { error: null, needsEmailConfirmation: !result.session }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateApiKey = async (key: string) => {
    if (!user) return
    await supabase.from('profiles').update({ claude_api_key: key }).eq('id', user.id)
    setUser({ ...user, claudeApiKey: key })
  }

  const updateProfile = async (data: { name: string; jobTitle: string }): Promise<string | null> => {
    if (!user) return 'You must be signed in.'
    const { error } = await supabase
      .from('profiles')
      .update({ name: data.name, job_title: data.jobTitle })
      .eq('id', user.id)
    if (error) return error.message
    setUser({ ...user, ...data })
    return null
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<string | null> => {
    if (!user) return 'You must be signed in to change your password.'
    if (newPassword.length < 6) return 'New password must be at least 6 characters.'
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
    if (reauthError) return 'Current password is incorrect.'
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return error.message
    return null
  }

  const requestPasswordReset = async (email: string): Promise<void> => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  }

  const updatePasswordFromRecovery = async (newPassword: string): Promise<string | null> => {
    if (newPassword.length < 6) return 'Password must be at least 6 characters.'
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return error.message
    return null
  }

  return (
    <AuthContext.Provider value={{
      user, loading, signIn, signUp, signOut, updateApiKey,
      updateProfile, changePassword, requestPasswordReset, updatePasswordFromRecovery,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
