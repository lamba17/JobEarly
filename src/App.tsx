import { useState, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { GmailProvider } from './context/GmailContext'
import Landing from './pages/Landing'
import RouteSeo from './components/site/RouteSeo'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Sitemap from './pages/Sitemap'
import { Privacy, Terms, Security, Dpa, Cookies, Refund } from './pages/LegalPages'
import { About, Careers, Customers, Press, Contact } from './pages/CompanyPages'
import AppLayout from './pages/app/Layout'
import Dashboard from './pages/app/Dashboard'
import ResumeBuilder from './pages/app/ResumeBuilder'
import CoverLetter from './pages/app/CoverLetter'
import JobTracker from './pages/app/JobTracker'
import Performance from './pages/app/Performance'
import Outreach from './pages/app/Outreach'
import Settings from './pages/app/Settings'
import Support from './pages/app/Support'
import { useSubscription } from './hooks/useSubscription'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/signin" replace />
  return <>{children}</>
}

// Cover Letters, Job Tracker, Analytics and Outreach are Pro features. A free user who opens one
// (e.g. by typing the URL) is sent to the dashboard, where the layout shows the "Pro feature" pop-up.
function ProRoute({ feature, children }: { feature: string; children: ReactNode }) {
  const { user } = useAuth()
  const { isPro, loading } = useSubscription(user?.id)
  if (loading) return null
  if (!isPro) return <Navigate to="/app/dashboard" replace state={{ proLocked: feature }} />
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
      <GmailProvider>
        <RouteSeo />
        <Routes>
          <Route path="/" element={<Landing theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/sitemap" element={<Sitemap theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/privacy" element={<Privacy theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/terms" element={<Terms theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/security" element={<Security theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/dpa" element={<Dpa theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/cookies" element={<Cookies theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/refund" element={<Refund theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/about" element={<About theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/careers" element={<Careers theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/customers" element={<Customers theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/press" element={<Press theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/contact" element={<Contact theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout theme={theme} toggleTheme={toggleTheme} />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="resume-builder" element={<ResumeBuilder />} />
            <Route path="cover-letter" element={<ProRoute feature="Cover Letters"><CoverLetter /></ProRoute>} />
            <Route path="job-match" element={<ProRoute feature="Job Tracker"><JobTracker /></ProRoute>} />
            <Route path="performance" element={<ProRoute feature="Analytics"><Performance /></ProRoute>} />
            <Route path="outreach" element={<ProRoute feature="Outreach"><Outreach /></ProRoute>} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Support />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GmailProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
