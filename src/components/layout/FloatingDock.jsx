import { NavLink } from 'react-router-dom'
import {
  Home, MessageSquare, Image, Users, CalendarDays,
  LayoutGrid, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',         icon: Home,          label: 'Home',     id: 'dock-home' },
  { to: '/forum',    icon: LayoutGrid,    label: 'Forum',    id: 'dock-forum' },
  { to: '/feed',     icon: Image,         label: 'Feed',     id: 'dock-feed' },
  { to: '/messages', icon: MessageSquare, label: 'Messages', id: 'dock-messages' },
  { to: '/board',    icon: Users,         label: 'Board',    id: 'dock-board' },
  { to: '/events',   icon: CalendarDays,  label: 'Events',   id: 'dock-events' },
]

export default function FloatingDock() {
  return (
    <nav
      className="floating-dock md:hidden"
      aria-label="Main navigation dock"
    >
      {/* Brand icon */}
      <div className="flex flex-col items-center gap-1 px-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #d97706, #c2410c)' }}>
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="dock-label" style={{ fontWeight: 700 }}>CP</span>
      </div>

      <div className="dock-separator" />

      {NAV_ITEMS.map(item => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            id={item.id}
            end={item.to === '/'}
            className={({ isActive }) => `dock-item${isActive ? ' active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="dock-icon-wrap">
              <Icon className="w-5 h-5" />
            </div>
            <span className="dock-label">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
