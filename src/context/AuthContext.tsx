import { createContext, useContext, useState, type ReactNode } from 'react'

export interface User {
  name: string
  email: string
  password: string
  jobTitle: string
  claudeApiKey?: string
}

interface AuthCtx {
  user: User | null
  signIn: (email: string, password: string) => string | null
  signUp: (data: User) => string | null
  signOut: () => void
  updateApiKey: (key: string) => void
  updateProfile: (data: { name: string; jobTitle: string }) => void
  changePassword: (currentPassword: string, newPassword: string) => string | null
  findAccount: (email: string) => boolean
  resetPassword: (email: string, newPassword: string) => string | null
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('je-current') ?? 'null') }
    catch { return null }
  })

  const persistUser = (updated: User) => {
    setUser(updated)
    localStorage.setItem('je-current', JSON.stringify(updated))
    const users: User[] = JSON.parse(localStorage.getItem('je-users') ?? '[]')
    const idx = users.findIndex(u => u.email === updated.email)
    if (idx !== -1) {
      users[idx] = updated
      localStorage.setItem('je-users', JSON.stringify(users))
    }
  }

  const signIn = (email: string, password: string): string | null => {
    const users: User[] = JSON.parse(localStorage.getItem('je-users') ?? '[]')
    const found = users.find(u => u.email === email && u.password === password)
    if (!found) return 'Invalid email or password. Please try again.'
    setUser(found)
    localStorage.setItem('je-current', JSON.stringify(found))
    return null
  }

  const signUp = (data: User): string | null => {
    const users: User[] = JSON.parse(localStorage.getItem('je-users') ?? '[]')
    if (users.find(u => u.email === data.email)) return 'An account with this email already exists.'
    users.push(data)
    localStorage.setItem('je-users', JSON.stringify(users))
    setUser(data)
    localStorage.setItem('je-current', JSON.stringify(data))
    return null
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('je-current')
  }

  const updateApiKey = (key: string) => {
    if (user) persistUser({ ...user, claudeApiKey: key })
  }

  const updateProfile = (data: { name: string; jobTitle: string }) => {
    if (user) persistUser({ ...user, ...data })
  }

  const changePassword = (currentPassword: string, newPassword: string): string | null => {
    if (!user) return 'You must be signed in to change your password.'
    if (user.password !== currentPassword) return 'Current password is incorrect.'
    if (newPassword.length < 6) return 'New password must be at least 6 characters.'
    persistUser({ ...user, password: newPassword })
    return null
  }

  const findAccount = (email: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem('je-users') ?? '[]')
    return users.some(u => u.email.toLowerCase() === email.toLowerCase())
  }

  const resetPassword = (email: string, newPassword: string): string | null => {
    if (newPassword.length < 6) return 'New password must be at least 6 characters.'
    const users: User[] = JSON.parse(localStorage.getItem('je-users') ?? '[]')
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase())
    if (idx === -1) return 'No account found with that email.'
    users[idx] = { ...users[idx], password: newPassword }
    localStorage.setItem('je-users', JSON.stringify(users))
    if (user?.email.toLowerCase() === email.toLowerCase()) persistUser(users[idx])
    return null
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, updateApiKey, updateProfile, changePassword, findAccount, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
