import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Zap, FlaskConical } from 'lucide-react'

// Test account credentials — pre-seeded in Supabase
const TEST_EMAIL    = 'demo@collegepulse.app'
const TEST_PASSWORD = 'DemoPass123!'

export default function AuthPage() {
  const navigate   = useNavigate()
  const [loading, setLoading] = useState(false)

  /* ── Google OAuth ── */
  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) { setLoading(false); toast.error(error.message) }
  }

  /* ── One-click Demo Login ── */
  const handleTestLogin = async () => {
    setLoading(true)

    // Try signing in first
    let { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL, password: TEST_PASSWORD,
    })

    // If account doesn't exist yet, create it automatically
    if (error && error.message.toLowerCase().includes('invalid')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: { data: { full_name: 'Demo User', username: 'demouser' } },
      })
      if (signUpError) { setLoading(false); toast.error(signUpError.message); return }
      data = signUpData

      // Create profile row for the demo user
      if (data.user) {
        await supabase.from('profiles').upsert({
          id:         data.user.id,
          email:      TEST_EMAIL,
          full_name:  'Demo User',
          username:   'demouser',
          department: 'Computer Science',
          year:       2,
          role:       'student',
          skills:     ['React', 'Supabase', 'Tailwind'],
        })
      }
    }

    if (error && !error.message.toLowerCase().includes('invalid')) {
      setLoading(false)
      toast.error(error.message)
      return
    }

    toast.success('Welcome, Demo User! 🎓')
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.22) 0%, transparent 70%)', top: '-10%', left: '-10%' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(194,65,12,0.18) 0%, transparent 70%)', bottom: '-5%', right: '-5%' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-card w-full max-w-sm p-8 relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #d97706, #c2410c)' }}>
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-bold text-2xl leading-none text-gradient-brand">CollegePulse</h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>NHCM Community Network</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Google Login */}
          <motion.button
            id="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: 'white',
              color: '#1a1a2e',
              border: '1px solid rgba(0,0,0,0.15)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <hr className="flex-1" style={{ borderColor: 'rgba(0,0,0,0.10)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>or</span>
            <hr className="flex-1" style={{ borderColor: 'rgba(0,0,0,0.10)' }} />
          </div>

          {/* Test / Demo Login */}
          <motion.button
            id="btn-demo-login"
            onClick={handleTestLogin}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full justify-center gap-2"
          >
            {loading
              ? <span className="animate-pulse">Loading…</span>
              : <>
                  <FlaskConical className="w-4 h-4" />
                  Try Demo — No Sign-up Needed
                </>
            }
          </motion.button>
        </div>

        <p className="text-center text-[11px] mt-8" style={{ color: 'var(--text-muted)' }}>
          By joining, you agree to the{' '}
          <span className="cursor-pointer hover:underline" style={{ color: 'var(--brand)' }}>Community Guidelines</span>
        </p>
      </motion.div>
    </div>
  )
}
