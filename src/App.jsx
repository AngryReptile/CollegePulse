import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useState, useEffect } from 'react'
import AppShell from './components/layout/AppShell'
import HomePage      from './pages/HomePage'
import AuthPage      from './pages/AuthPage'
import ForumPage     from './pages/ForumPage'
import FeedPage      from './pages/FeedPage'
import MessagesPage  from './pages/MessagesPage'
import ProfilePage   from './pages/ProfilePage'
import BoardPage     from './pages/BoardPage'
import EventsPage    from './pages/EventsPage'
import AdminPage     from './pages/AdminPage'
import { motion, AnimatePresence } from 'framer-motion'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  // Safety net: if loading takes more than 4s, stop waiting
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setTimedOut(true), 4000)
    return () => clearTimeout(t)
  }, [loading])

  if (loading && !timedOut) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

// Public route: show content immediately, redirect if already logged in
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  // Don't block the auth page behind a spinner — show it immediately.
  // If auth resolves and user IS logged in, we redirect.
  if (!loading && user) return <Navigate to="/" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-white text-2xl">⚡</span>
      </motion.div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading CollegePulse…</p>
    </div>
  )
}

export default function App() {
  useAuth() // Initialize auth globally

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

        {/* Protected — authenticated shell */}
        <Route path="/" element={<AppShell><HomePage /></AppShell>} />
        <Route path="/forum" element={<AppShell><ForumPage /></AppShell>} />
        <Route path="/feed" element={<AppShell><FeedPage /></AppShell>} />
        <Route path="/messages" element={<AppShell><MessagesPage /></AppShell>} />
        <Route path="/profile" element={<AppShell><ProfilePage /></AppShell>} />
        <Route path="/profile/:username" element={<AppShell><ProfilePage /></AppShell>} />
        <Route path="/board" element={<AppShell><BoardPage /></AppShell>} />
        <Route path="/events" element={<AppShell><EventsPage /></AppShell>} />
        <Route path="/admin" element={<AppShell><AdminPage /></AppShell>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
