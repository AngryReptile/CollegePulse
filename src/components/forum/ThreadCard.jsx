import { motion } from 'framer-motion'
import { MessageSquare, Eye, Pin, TrendingUp, Clock } from 'lucide-react'
import { timeAgo, generateInitials, getAvatarGradient, truncate } from '../../lib/utils'

export default function ThreadCard({ thread, index = 0, isTrending = false, onClick }) {
  const initials = generateInitials(thread.profiles?.full_name || '')
  const gradient = getAvatarGradient(thread.author_id)

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      onClick={onClick}
      className="glass-card p-5 cursor-pointer"
      whileHover={{ scale: 1.01 }}
      id={`thread-${thread.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Author avatar */}
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
          {thread.profiles?.avatar_url
            ? <img src={thread.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
            : initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {thread.is_pinned && (
              <span className="badge badge-violet text-xs"><Pin className="w-2.5 h-2.5" /> Pinned</span>
            )}
            {isTrending && (
              <span className="trending-badge"><TrendingUp className="w-2.5 h-2.5 inline mr-0.5" /> Trending</span>
            )}
            {thread.category && (
              <span className="badge badge-brand text-xs">{thread.category}</span>
            )}
          </div>

          {/* Title */}
          <h2 className="font-display font-semibold text-base leading-snug mb-1.5 hover:text-blue-400 transition-colors">
            {thread.title}
          </h2>

          {/* Body preview */}
          {thread.body && (
            <p className="text-sm mb-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {truncate(thread.body, 140)}
            </p>
          )}

          {/* Tags */}
          {(thread.tags?.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {thread.tags.slice(0, 4).map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer meta */}
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              {thread.profiles?.username ? `@${thread.profiles.username}` : 'Unknown'}
            </span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(thread.created_at)}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.views || 0}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{thread.comment_count || 0}</span>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
