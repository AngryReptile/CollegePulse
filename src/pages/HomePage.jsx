import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { generateInitials, getAvatarGradient, timeAgo } from '../lib/utils'
import {
  LayoutGrid, Image, MessageSquare, Users, CalendarDays,
  TrendingUp, Star, Zap, ArrowRight, Activity
} from 'lucide-react'

export default function HomePage() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ threads: 0, posts: 0, members: 0, events: 0 })
  const [recentThreads, setRecentThreads] = useState([])
  const [recentPosts, setRecentPosts]     = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])

  useEffect(() => { fetchDashboardData() }, [])

  async function fetchDashboardData() {
    const [
      { count: threads },
      { count: posts },
      { count: members },
      { count: events },
      { data: latestThreads },
      { data: latestPosts },
      { data: nextEvents },
    ] = await Promise.all([
      supabase.from('forum_threads').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('forum_threads').select('*, profiles:author_id(full_name, username)').order('created_at', { ascending: false }).limit(4),
      supabase.from('posts').select('*, profiles:author_id(full_name, username)').order('created_at', { ascending: false }).limit(3),
      supabase.from('events').select('*').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(3),
    ])
    setStats({ threads: threads || 0, posts: posts || 0, members: members || 0, events: events || 0 })
    setRecentThreads(latestThreads || [])
    setRecentPosts(latestPosts || [])
    setUpcomingEvents(nextEvents || [])
  }

  const QUICK_LINKS = [
    { icon: LayoutGrid, label: 'Forum',    sub: 'Discuss & debate',     path: '/forum',    color: '#2563eb' },
    { icon: Image,      label: 'Feed',     sub: 'Campus photos',        path: '/feed',     color: '#7c3aed' },
    { icon: MessageSquare, label: 'Messages', sub: 'Private DMs',       path: '/messages', color: '#06b6d4' },
    { icon: Users,      label: 'Board',    sub: 'Find teammates',       path: '/board',    color: '#10b981' },
    { icon: CalendarDays, label: 'Events', sub: 'Fests & workshops',    path: '/events',   color: '#f43f5e' },
    { icon: Star,       label: 'Profile',  sub: 'Your portfolio',       path: '/profile',  color: '#f59e0b' },
  ]

  const STAT_CARDS = [
    { label: 'Threads',  value: stats.threads,  icon: LayoutGrid,    color: '#2563eb' },
    { label: 'Posts',    value: stats.posts,    icon: Image,         color: '#7c3aed' },
    { label: 'Members',  value: stats.members,  icon: Users,         color: '#06b6d4' },
    { label: 'Events',   value: stats.events,   icon: CalendarDays,  color: '#10b981' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-card p-7 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)', borderColor: 'rgba(37,99,235,0.2)' }}
      >
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-8 left-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)' }} />

        <div className="flex items-start gap-5 relative z-10">
          {profile && (
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarGradient(profile.id)} flex items-center justify-center text-xl font-bold text-white flex-shrink-0`}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                : generateInitials(profile.full_name || '')}
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl mb-1">
              {profile ? <>Hey, {profile.full_name?.split(' ')[0]}! 👋</> : <>Welcome to <span className="text-gradient">CollegePulse</span></>}
            </h1>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {profile
                ? `${profile.department || 'NHCM'} · Year ${profile.year || '?'} · ${profile.role === 'admin' ? '🎓 Faculty/Admin' : '🎒 Student'}`
                : 'The NHCM Community Network — connect, collaborate, and thrive.'}
            </p>
            {!user && (
              <div className="flex gap-3">
                <button onClick={() => navigate('/auth')} className="btn-primary">Join CollegePulse <ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => navigate('/forum')} className="btn-secondary">Browse Forum</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 badge badge-brand">
            <Activity className="w-3.5 h-3.5" /> Live
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i + 0.1, duration: 0.4 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}22` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="font-display font-bold text-xl leading-none" style={{ color }}>{value.toLocaleString()}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" /> Quick Access
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map(({ icon: Icon, label, sub, path, color }, i) => (
            <motion.button
              key={path}
              id={`quick-${label.toLowerCase()}`}
              onClick={() => navigate(path)}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i + 0.25, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="glass-card p-4 flex flex-col items-center gap-2 text-center"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="font-semibold text-xs">{label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Threads */}
        <motion.section initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Recent Threads
            </h2>
            <button onClick={() => navigate('/forum')} className="btn-ghost text-xs py-1">View all <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-2">
            {recentThreads.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.35 }}
                onClick={() => navigate('/forum')}
                className="glass-card p-3 cursor-pointer flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAvatarGradient(t.author_id)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                  {generateInitials(t.profiles?.full_name || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>@{t.profiles?.username} · {timeAgo(t.created_at)}</p>
                </div>
              </motion.div>
            ))}
            {recentThreads.length === 0 && <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No threads yet.</p>}
          </div>
        </motion.section>

        {/* Upcoming Events */}
        <motion.section initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-rose-400" /> Upcoming Events
            </h2>
            <button onClick={() => navigate('/events')} className="btn-ghost text-xs py-1">View all <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.4 }}
                onClick={() => navigate('/events')}
                className="glass-card p-3 cursor-pointer flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185' }}>
                  {new Date(ev.event_date).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ev.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{ev.venue || 'TBD'}</p>
                </div>
                <span className="badge badge-rose text-xs flex-shrink-0">
                  {new Date(ev.event_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </span>
              </motion.div>
            ))}
            {upcomingEvents.length === 0 && <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No upcoming events.</p>}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
