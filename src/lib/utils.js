import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

export function timeAgo(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date) {
  const d = new Date(date)
  if (isToday(d))     return `Today at ${format(d, 'h:mm a')}`
  if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`
  return format(d, 'MMM d, yyyy')
}

export function formatTime(date) {
  return format(new Date(date), 'h:mm a')
}

export function generateInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('')
}

export function getAvatarGradient(userId = '') {
  const gradients = [
    'from-blue-500 to-violet-600',
    'from-rose-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-indigo-600',
  ]
  const idx = userId.charCodeAt(0) % gradients.length
  return gradients[idx]
}

export function truncate(str = '', len = 120) {
  return str.length > len ? str.slice(0, len) + '…' : str
}

export function slugify(str = '') {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// Role is assigned manually via the Admin Dashboard (DB-driven only).
// This helper is kept for import compatibility but always returns false.
export function isAdminEmail(_email = '') {
  return false
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function getCountdown(targetDate) {
  const now  = new Date()
  const end  = new Date(targetDate)
  const diff = end - now

  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, expired: true }

  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    mins:    Math.floor((diff % 3600000)  / 60000),
    secs:    Math.floor((diff % 60000)    / 1000),
    expired: false,
  }
}
