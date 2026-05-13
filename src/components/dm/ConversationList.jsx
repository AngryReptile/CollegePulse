import { motion } from 'framer-motion'
import { generateInitials, getAvatarGradient, timeAgo, truncate } from '../../lib/utils'

export default function ConversationList({ conversations, selectedId, onSelect }) {
  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm font-medium">No conversations yet</p>
        <p className="text-xs mt-1">Message someone from their profile or a post</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 overflow-y-auto">
      {conversations.map((conv, i) => {
        const other   = conv.other_user
        const lastMsg = conv.last_message
        const gradient = getAvatarGradient(other?.id || '')
        const initials = generateInitials(other?.full_name || '')
        const isSelected = conv.id === selectedId
        const hasUnread = conv.unread_count > 0

        return (
          <motion.button
            key={conv.id}
            id={`conv-${conv.id}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(conv)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${isSelected ? 'glass-card-active' : 'hover:bg-white/5'}`}
          >
            <div className="relative flex-shrink-0">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold text-white`}>
                {other?.avatar_url
                  ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  : initials}
              </div>
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#2563eb' }}>
                  {conv.unread_count}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-white' : 'font-medium'}`}>
                  {other?.full_name || 'Unknown'}
                </span>
                {lastMsg && (
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                    {timeAgo(lastMsg.created_at)}
                  </span>
                )}
              </div>
              {lastMsg && (
                <p className="text-xs truncate mt-0.5" style={{ color: hasUnread ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                  {truncate(lastMsg.body, 45)}
                </p>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
