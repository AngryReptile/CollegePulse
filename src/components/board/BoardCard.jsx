import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { generateInitials, getAvatarGradient, timeAgo } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { MessageSquare, Check, Users, Search, AlertTriangle, Tag, Trash2 } from 'lucide-react'

const CATEGORY_CONFIG = {
  teammate: { label: 'Teammate Wanted', icon: Users,         color: 'badge-brand',  bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.2)' },
  lost:     { label: 'Lost Item',       icon: AlertTriangle, color: 'badge-rose',   bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)' },
  found:    { label: 'Found Item',      icon: Search,        color: 'badge-green',  bg: 'rgba(16,185,129,0.08)',border: 'rgba(16,185,129,0.2)' },
}

export default function BoardCard({ item, index = 0, onResolved }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.teammate
  const Icon = config.icon
  const initials = generateInitials(item.profiles?.full_name || '')
  const gradient = getAvatarGradient(item.author_id)
  const isOwner  = user?.id === item.author_id

  async function markResolved() {
    const { error } = await supabase.from('board_items').update({ is_resolved: true }).eq('id', item.id)
    if (error) { toast.error('Failed to update'); return }
    toast.success('Marked as resolved! ✓')
    onResolved?.(item.id)
  }

  async function deleteItem() {
    if (!window.confirm('Delete this post?')) return
    const { error } = await supabase.from('board_items').delete().eq('id', item.id)
    if (error) { toast.error(error.message); return }
    toast.success('Post deleted')
    onResolved?.(item.id) // reuse to remove from list
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -2 }}
      className="glass-card overflow-hidden relative"
      style={{ background: config.bg, borderColor: config.border }}
      id={`board-${item.id}`}
    >
      {item.is_resolved && (
        <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl" style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm font-medium text-green-400">Resolved</span>
          </div>
        </div>
      )}

      {/* Image */}
      {item.image_url && (
        <div className="w-full h-40 overflow-hidden">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`badge ${config.color}`}><Icon className="w-3 h-3" />{config.label}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(item.created_at)}</span>
        </div>

        {/* Title */}
        <h3 className="font-display font-semibold text-sm mb-1.5 leading-snug">{item.title}</h3>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                <Tag className="w-2.5 h-2.5 inline mr-0.5" />{t}
              </span>
            ))}
          </div>
        )}

        {/* Author + Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => navigate(`/profile/${item.profiles?.username}`)}>
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
              {item.profiles?.avatar_url
                ? <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-lg" />
                : initials}
            </div>
            <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{item.profiles?.full_name || 'Unknown'}</span>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {/* Contact — visible to all non-owners */}
            {!isOwner && (
              <button
                id={`btn-dm-board-${item.id}`}
                onClick={() => {
                  if (!user) { navigate('/auth'); return }
                  navigate('/messages?with=' + item.author_id)
                }}
                className="btn-primary text-xs py-1.5 px-3"
              >
                <MessageSquare className="w-3 h-3" /> Contact
              </button>
            )}
            {isOwner && !item.is_resolved && (
              <button
                id={`btn-resolve-${item.id}`}
                onClick={markResolved}
                className="btn-secondary text-xs py-1.5 px-3"
                style={{ color: '#16a34a', borderColor: 'rgba(22,163,74,0.3)' }}
              >
                <Check className="w-3 h-3" /> Resolve
              </button>
            )}
            {isOwner && (
              <button
                id={`btn-delete-board-${item.id}`}
                onClick={deleteItem}
                className="btn-secondary text-xs py-1.5 px-2"
                style={{ color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)' }}
                title="Delete post"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
