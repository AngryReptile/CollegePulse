import { NavLink } from 'react-router-dom'
import {
  Home, MessageSquare, Image, Users, CalendarDays, LayoutGrid
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
    <nav className="floating-dock md:hidden" aria-label="Main navigation dock">
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
