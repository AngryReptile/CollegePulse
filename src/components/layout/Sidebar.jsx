import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { generateInitials, getAvatarGradient } from '../../lib/utils'
import ActiveNow from '../forum/ActiveNow'
import {
  Home, LayoutGrid, Image, MessageSquare, Users,
  CalendarDays, User, LogOut, Shield, Zap
} from 'lucide-react'

const NAV = [
  { to: '/',         icon: Home,          label: 'Home' },
  { to: '/forum',    icon: LayoutGrid,    label: 'Discussion Forum' },
  { to: '/feed',     icon: Image,         label: 'Social Feed' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/board',    icon: Users,         label: 'Board & Lost+Found' },
  { to: '/events',   icon: CalendarDays,  label: 'Events & Tickets' },
]

export default function Sidebar() {
  const { profile, isAdmin, signOut } = useAuthStore(s => ({
    profile: s.profile, isAdmin: s.isAdmin(), signOut: s.signOut
  }))
  const navigate = useNavigate()

  const initials = generateInitials(profile?.full_name || '')
  const gradient = getAvatarGradient(profile?.id || '')

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-sm leading-none text-gradient-brand">CollegePulse</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>Campus Community</p>
        </div>
      </div>

      {/* Active Now widget */}
      <ActiveNow userId={profile?.id} username={profile?.username} />

      <hr className="glass-divider" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV.map(item => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <hr className="glass-divider" />

      {/* Admin Dashboard link — only for admins */}
      {isAdmin && (
        <>
          <NavLink
            to="/admin"
            id="nav-admin"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) => isActive ? {} : { color: 'rgba(167,139,250,0.8)' }}
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate font-semibold">Admin Dashboard</span>
          </NavLink>
        </>
      )}

      {/* Profile mini-card */}
      {profile && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          onClick={() => navigate('/profile')}
        >
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none truncate">{profile.full_name}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>@{profile.username}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); handleSignOut() }}
            className="btn-ghost p-1.5" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </aside>
  )
}
