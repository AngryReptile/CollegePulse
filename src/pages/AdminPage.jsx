import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { generateInitials, getAvatarGradient, formatDate, timeAgo } from '../lib/utils'
import toast from 'react-hot-toast'
import {
  Shield, Users, UserCheck, GraduationCap, Search,
  RefreshCw, ChevronDown, TrendingUp, MessageSquare,
  Image, CalendarDays, LayoutGrid, ToggleLeft, ToggleRight,
  AlertTriangle, Crown, Activity
} from 'lucide-react'

export default function AdminPage() {
  const { profile: myProfile } = useAuthStore()
  const navigate = useNavigate()

  // Guard — non-admins get bounced immediately
  useEffect(() => {
    if (myProfile && myProfile.role !== 'admin') {
      toast.error('Access denied')
      navigate('/')
    }
  }, [myProfile, navigate])

  const [users, setUsers]       = useState([])
  const [stats, setStats]       = useState({ total: 0, admins: 0, students: 0, threads: 0, posts: 0, events: 0 })
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all') // 'all' | 'admin' | 'student'
  const [loading, setLoading]   = useState(true)
  const [toggling, setToggling] = useState(null) // userId being toggled
  const [sortBy, setSortBy]     = useState('created_at') // 'created_at' | 'full_name' | 'role'

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [
      { data: allUsers },
      { count: adminCount },
      { count: studentCount },
      { count: threadCount },
      { count: postCount },
      { count: eventCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('forum_threads').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
    ])
    setUsers(allUsers || [])
    setStats({
      total:    (allUsers || []).length,
      admins:   adminCount  || 0,
      students: studentCount || 0,
      threads:  threadCount  || 0,
      posts:    postCount    || 0,
      events:   eventCount   || 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function toggleRole(user) {
    if (user.id === myProfile?.id) {
      toast.error("You can't demote yourself!")
      return
    }
    const newRole = user.role === 'admin' ? 'student' : 'admin'
    setToggling(user.id)

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id)

    setToggling(null)

    if (error) {
      toast.error(`Failed: ${error.message}`)
      return
    }

    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
    setStats(prev => ({
      ...prev,
      admins:   newRole === 'admin' ? prev.admins + 1 : prev.admins - 1,
      students: newRole === 'student' ? prev.students + 1 : prev.students - 1,
    }))
    toast.success(
      newRole === 'admin'
        ? `${user.full_name} promoted to Admin 🎓`
        : `${user.full_name} set back to Student 🎒`
    )
  }

  // Filter + search + sort
  const filtered = users
    .filter(u => filter === 'all' || u.role === filter)
    .filter(u =>
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'full_name') return (a.full_name || '').localeCompare(b.full_name || '')
      if (sortBy === 'role') return a.role.localeCompare(b.role)
      return new Date(b.created_at) - new Date(a.created_at) // newest first
    })

  if (myProfile && myProfile.role !== 'admin') return null

  const STAT_CARDS = [
    { label: 'Total Members', value: stats.total,    icon: Users,          color: '#2563eb' },
    { label: 'Admins',        value: stats.admins,   icon: Crown,          color: '#7c3aed' },
    { label: 'Students',      value: stats.students, icon: GraduationCap,  color: '#06b6d4' },
    { label: 'Threads',       value: stats.threads,  icon: LayoutGrid,     color: '#10b981' },
    { label: 'Posts',         value: stats.posts,    icon: Image,          color: '#f59e0b' },
    { label: 'Events',        value: stats.events,   icon: CalendarDays,   color: '#f43f5e' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-7 flex-wrap gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl">Admin Dashboard</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Manage users and roles · NHCM Network
            </p>
          </div>
        </div>
        <button onClick={fetchAll} className="btn-secondary" id="btn-admin-refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </motion.div>

      {/* Stats bento */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex flex-col items-center text-center gap-2"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${color}22` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="font-display font-bold text-xl leading-none" style={{ color }}>
              {value.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* User Management */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card overflow-hidden"
      >
        {/* Table header toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h2 className="font-display font-semibold text-base flex items-center gap-2 mr-auto">
            <Users className="w-4 h-4 text-blue-400" /> User Management
            <span className="badge badge-brand">{filtered.length}</span>
          </h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <input
              id="admin-search"
              type="text"
              placeholder="Search name, email, dept…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input pl-9 text-sm py-2"
              style={{ width: 220 }}
            />
          </div>

          {/* Role filter */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { value: 'all',     label: 'All' },
              { value: 'admin',   label: '🎓 Admins' },
              { value: 'student', label: '🎒 Students' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.value ? 'text-white' : ''}`}
                style={filter === f.value ? { background: 'rgba(255,255,255,0.12)' } : { color: 'var(--text-muted)' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            id="admin-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="glass-input text-xs py-2 appearance-none"
            style={{ width: 140 }}
          >
            <option value="created_at">Newest first</option>
            <option value="full_name">Name A–Z</option>
            <option value="role">Role</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-40" />
                  <div className="skeleton h-3 w-56" />
                </div>
                <div className="skeleton h-8 w-28 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No users match your search.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'rgba(255,255,255,0.05)' }}>
            {filtered.map((user, i) => (
              <UserRow
                key={user.id}
                user={user}
                index={i}
                isSelf={user.id === myProfile?.id}
                toggling={toggling === user.id}
                onToggle={() => toggleRole(user)}
                onViewProfile={() => navigate(`/profile/${user.username}`)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t flex items-center gap-2 text-xs" style={{ borderColor: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)' }}>
          <Activity className="w-3.5 h-3.5 text-green-400" />
          Showing {filtered.length} of {users.length} users ·
          {' '}<span className="text-violet-400">{stats.admins} admins</span> ·
          {' '}<span className="text-blue-400">{stats.students} students</span>
        </div>
      </motion.div>

      {/* Role system explanation card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-5 mt-4"
        style={{ borderColor: 'rgba(251,113,133,0.15)', background: 'rgba(251,113,133,0.04)' }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p className="font-semibold mb-1 text-white">Role System Notes</p>
            <ul className="space-y-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <li>• All new sign-ups default to <span className="badge badge-brand text-xs">student</span> — role is assigned manually here.</li>
              <li>• <span className="badge badge-violet text-xs">admin</span> users can create events, pin threads, manage all content, and access this dashboard.</li>
              <li>• You cannot demote your own account (safety lock).</li>
              <li>• Role changes take effect immediately — the user's session picks up the new role on their next page load.</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function UserRow({ user, index, isSelf, toggling, onToggle, onViewProfile }) {
  const gradient = getAvatarGradient(user.id)
  const initials  = generateInitials(user.full_name || '')
  const isAdmin   = user.role === 'admin'

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors"
      id={`user-row-${user.id}`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold text-white flex-shrink-0 cursor-pointer`}
        onClick={onViewProfile}
      >
        {user.avatar_url
          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
          : initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-medium cursor-pointer hover:text-blue-400 transition-colors"
            onClick={onViewProfile}
          >
            {user.full_name || 'Unnamed User'}
          </span>
          {isSelf && (
            <span className="badge badge-cyan text-xs py-0.5">You</span>
          )}
          <span className={`badge text-xs py-0.5 ${isAdmin ? 'badge-violet' : 'badge-brand'}`}>
            {isAdmin ? '🎓 Admin' : '🎒 Student'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>@{user.username || '—'}</span>
          <span className="hidden sm:inline">{user.email}</span>
          {user.department && <span>{user.department}</span>}
          {user.year && <span>Year {user.year}</span>}
          <span className="hidden md:inline">{timeAgo(user.created_at)}</span>
        </div>
      </div>

      {/* Toggle button */}
      <div className="flex-shrink-0">
        <motion.button
          id={`btn-toggle-role-${user.id}`}
          onClick={onToggle}
          disabled={toggling || isSelf}
          whileTap={isSelf ? {} : { scale: 0.94 }}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl transition-all border ${
            isSelf
              ? 'opacity-30 cursor-not-allowed border-white/10'
              : isAdmin
                ? 'border-violet-500/30 text-violet-300 hover:bg-violet-500/10'
                : 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10'
          }`}
          style={{ background: 'rgba(255,255,255,0.03)' }}
          title={isSelf ? "Can't demote yourself" : isAdmin ? 'Demote to Student' : 'Promote to Admin'}
        >
          {toggling ? (
            <span className="animate-spin">⟳</span>
          ) : isAdmin ? (
            <><ToggleRight className="w-4 h-4 text-violet-400" /> Demote</>
          ) : (
            <><ToggleLeft className="w-4 h-4 text-blue-400" /> Promote</>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
