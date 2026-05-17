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
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('je-current') ?? 'null') }
    catch { return null }
  })

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
    if (user) {
      const updated = { ...user, claudeApiKey: key }
      setUser(updated)
      localStorage.setItem('je-current', JSON.stringify(updated))
      const users: User[] = JSON.parse(localStorage.getItem('je-users') ?? '[]')
      const idx = users.findIndex(u => u.email === user.email)
      if (idx !== -1) {
        users[idx] = updated
        localStorage.setItem('je-users', JSON.stringify(users))
      }
    }
  }

  return <AuthContext.Provider value={{ user, signIn, signUp, signOut, updateApiKey }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
