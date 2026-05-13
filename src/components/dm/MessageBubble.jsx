import { motion } from 'framer-motion'
import { generateInitials, getAvatarGradient, formatTime, truncate } from '../../lib/utils'

export default function MessageBubble({ message, isOwn, prevSameAuthor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ marginTop: prevSameAuthor ? 2 : 12 }}
      id={`msg-${message.id}`}
    >
      {/* Avatar — only show for first message in a group */}
      {!isOwn && (
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getAvatarGradient(message.sender_id)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${prevSameAuthor ? 'opacity-0' : ''}`}>
          {message.profiles?.avatar_url
            ? <img src={message.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-lg" />
            : generateInitials(message.profiles?.full_name || '')}
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!prevSameAuthor && !isOwn && (
          <span className="text-xs mb-1 px-1" style={{ color: 'var(--text-muted)' }}>
            {message.profiles?.full_name}
          </span>
        )}
        <div className={isOwn ? 'msg-bubble-out' : 'msg-bubble-in'}>
          {message.body}
        </div>
        <span className="text-xs mt-1 px-1" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
          {formatTime(message.created_at)} {isOwn && (message.read ? '✓✓' : '✓')}
        </span>
      </div>
    </motion.div>
  )
}
