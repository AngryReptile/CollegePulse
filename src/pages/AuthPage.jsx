import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  Mail, Lock, User, GraduationCap, BookOpen,
  Eye, EyeOff, Zap, ArrowRight
} from 'lucide-react'

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Arts & Humanities', 'Science', 'Commerce', 'Law',
]

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', username: '',
    department: '', year: '1',
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Welcome back! 🎉')
    navigate('/')
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    })
    if (error) {
      setLoading(false)
      toast.error(error.message)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.username.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)


    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, username: form.username },
      },
    })

    if (error) { setLoading(false); toast.error(error.message); return }

    if (data.user) {
      // Create profile row
      await supabase.from('profiles').upsert({
        id:          data.user.id,
        email:       form.email,
        full_name:   form.fullName,
        username:    form.username,
        department:  form.department,
        year:        parseInt(form.year),
        role:        'student',  // always; promoted via Admin Dashboard
        skills:      [],
      })
    }

    setLoading(false)
    toast.success('Account created! Check your email to confirm.')
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)', top: '-10%', left: '-10%' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', bottom: '-5%', right: '-5%' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none text-gradient-brand">CollegePulse</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>NHCM Community Network</p>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl p-1 mb-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['signin', 'signup'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m ? 'text-white' : ''}`}
              style={mode === m ? { background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white' } : { color: 'var(--text-muted)' }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === 'signin' ? (
            <motion.form key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input id="signin-email" type="email" placeholder="you@nhcm.ac.in" value={form.email} onChange={e => update('email', e.target.value)} required className="glass-input pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input id="signin-password" type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} required className="glass-input pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <motion.button id="btn-signin" type="submit" disabled={loading} whileTap={{ scale: 0.97 }} className="btn-primary w-full justify-center mt-2">
                {loading ? <span className="animate-pulse">Signing in…</span> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </motion.button>

              <div className="flex items-center gap-3 my-6">
                <hr className="flex-1 opacity-10" />
                <span className="text-[10px] uppercase tracking-widest opacity-30 font-bold">OR CONTINUE WITH</span>
                <hr className="flex-1 opacity-10" />
              </div>

              <motion.button
                type="button"
                onClick={handleGoogleLogin}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary w-full justify-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </motion.button>
            </motion.form>
          ) : (
            <motion.form key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input id="signup-name" type="text" placeholder="Your name" value={form.fullName} onChange={e => update('fullName', e.target.value)} required className="glass-input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>@</span>
                    <input id="signup-username" type="text" placeholder="username" value={form.username} onChange={e => update('username', e.target.value.toLowerCase().replace(/\s/g,''))} required className="glass-input pl-8" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input id="signup-email" type="email" placeholder="you@nhcm.ac.in" value={form.email} onChange={e => update('email', e.target.value)} required className="glass-input pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input id="signup-password" type={showPwd ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={e => update('password', e.target.value)} required minLength={8} className="glass-input pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Department</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <select id="signup-dept" value={form.department} onChange={e => update('department', e.target.value)} className="glass-input pl-10 appearance-none">
                      <option value="">Select…</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Year</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <select id="signup-year" value={form.year} onChange={e => update('year', e.target.value)} className="glass-input pl-10 appearance-none">
                      {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <motion.button id="btn-signup" type="submit" disabled={loading} whileTap={{ scale: 0.97 }} className="btn-primary w-full justify-center mt-2">
                {loading ? <span className="animate-pulse">Creating account…</span> : <><span>Join CollegePulse</span><ArrowRight className="w-4 h-4" /></>}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          By joining, you agree to the{' '}
          <span className="text-blue-400 cursor-pointer hover:underline">Community Guidelines</span>
        </p>
      </motion.div>
    </div>
  )
}
