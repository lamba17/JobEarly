import { useState, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import AppLayout from './pages/app/Layout'
import Dashboard from './pages/app/Dashboard'
import ResumeBuilder from './pages/app/ResumeBuilder'
import JobMatch from './pages/app/JobMatch'
import Performance from './pages/app/Performance'
import Outreach from './pages/app/Outreach'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/signin" replace />
  return <>{children}</>
}

export default function App() {
  const [theme, setTheme] = useState<string>(() => {
    const saved = localStorage.getItem('je-theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('je-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout theme={theme} toggleTheme={toggleTheme} />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="resume-builder" element={<ResumeBuilder />} />
            <Route path="job-match" element={<JobMatch />} />
            <Route path="performance" element={<Performance />} />
            <Route path="outreach" element={<Outreach />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
