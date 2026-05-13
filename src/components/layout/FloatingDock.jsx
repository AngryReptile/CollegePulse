import { NavLink, useLocation } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'
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

function DockIcon({ item, mouseX }) {
  const ref = useRef(null)

  const distance = useMotionValue(0)
  const scale = useSpring(
    useTransform(distance, [-120, 0, 120], [0.9, 1.3, 0.9]),
    { stiffness: 260, damping: 20 }
  )
  const translateY = useSpring(
    useTransform(distance, [-120, 0, 120], [0, -14, 0]),
    { stiffness: 260, damping: 20 }
  )

  function handleMouseMove(e) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const d = e.clientX - (rect.left + rect.width / 2)
    distance.set(d)
  }

  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      id={item.id}
      className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => distance.set(9999)}
      ref={ref}
      style={{ textDecoration: 'none' }}
    >
      <motion.div className="dock-icon-wrap" style={{ scale, translateY }}>
        <Icon className="w-5 h-5" />
      </motion.div>
      <span className="dock-label">{item.label}</span>
    </NavLink>
  )
}

export default function FloatingDock() {
  const mouseX = useMotionValue(Infinity)

  return (
    <motion.nav
      className="floating-dock"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 24 }}
      onMouseMove={e => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      aria-label="Main navigation dock"
    >
      {/* Brand icon */}
      <div className="flex flex-col items-center gap-1 px-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="dock-label" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>CP</span>
      </div>

      <div className="dock-separator" />

      {NAV_ITEMS.map(item => (
        <DockIcon key={item.to} item={item} mouseX={mouseX} />
      ))}
    </motion.nav>
  )
}
