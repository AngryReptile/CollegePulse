import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useRealtime } from '../../hooks/useRealtime'
import { generateInitials, getAvatarGradient, timeAgo } from '../../lib/utils'
import toast from 'react-hot-toast'
import { Send, Reply, ChevronDown, Trash2 } from 'lucide-react'

export default function CommentThread({ threadId }) {
  const { user, profile } = useAuthStore()
  const [comments, setComments]   = useState([])
  const [body, setBody]           = useState('')
  const [replyTo, setReplyTo]     = useState(null) // { id, username }
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => { fetchComments() }, [threadId]) // eslint-disable-line

  // Real-time new comments
  useRealtime(
    `thread-comments-${threadId}`,
    { event: 'INSERT', table: 'forum_comments', filter: `thread_id=eq.${threadId}`,
      callback: async (payload) => {
        // Fetch full comment with profile
        const { data } = await supabase
          .from('forum_comments')
          .select('*, profiles:author_id(id, full_name, username, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (data) setComments(prev => [...prev, data])
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    },
    [threadId]
  )

  async function fetchComments() {
    setFetching(true)
    const { data } = await supabase
      .from('forum_comments')
      .select('*, profiles:author_id(id, full_name, username, avatar_url)')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setFetching(false)
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!body.trim() || !user) return
    setLoading(true)
    const { error } = await supabase.from('forum_comments').insert({
      thread_id: threadId,
      author_id: user.id,
      parent_id: replyTo?.id || null,
      body: body.trim(),
    })
    setLoading(false)
    if (error) { toast.error('Failed to post comment'); return }
    setBody('')
    setReplyTo(null)
  }

  // Build tree: root comments + their replies
  const roots   = comments.filter(c => !c.parent_id)
  const replies  = comments.filter(c =>  c.parent_id)
  const getReplies = (id) => replies.filter(r => r.parent_id === id)

  return (
    <div>
      <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        {comments.length} Comment{comments.length !== 1 ? 's' : ''}
      </h3>

      {/* Comment list */}
      {fetching ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {roots.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={getReplies(comment.id)}
                onReply={(c) => setReplyTo({ id: c.id, username: c.profiles?.username })}
                onDelete={(id) => setComments(prev => prev.filter(c => c.id !== id))}
                currentUserId={user?.id}
              />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      {user && (
        <form onSubmit={submitComment} className="mt-4 glass-card p-3">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs px-1" style={{ color: 'var(--text-muted)' }}>
              <Reply className="w-3 h-3" />
              Replying to <span className="text-blue-400">@{replyTo.username}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="ml-auto hover:text-white">✕</button>
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getAvatarGradient(user.id)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
              {generateInitials(profile?.full_name || '')}
            </div>
            <textarea
              id="comment-input"
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(e) } }}
              className="glass-input resize-none text-sm flex-1"
              rows={2}
              placeholder="Write a comment… (Enter to submit, Shift+Enter for newline)"
            />
            <motion.button
              id="btn-submit-comment"
              type="submit"
              disabled={loading || !body.trim()}
              whileTap={{ scale: 0.9 }}
              className="btn-primary py-2 px-3 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </form>
      )}
    </div>
  )
}

function CommentItem({ comment, replies = [], onReply, onDelete, currentUserId }) {
  const [expanded, setExpanded] = useState(true)
  const initials = generateInitials(comment.profiles?.full_name || '')
  const gradient = getAvatarGradient(comment.profiles?.id || '')
  const canDelete = currentUserId && currentUserId === comment.author_id

  async function handleDelete() {
    if (!window.confirm('Delete this comment?')) return
    const { error } = await supabase.from('forum_comments').delete().eq('id', comment.id)
    if (error) { toast.error('Failed to delete'); return }
    onDelete?.(comment.id)
    toast.success('Comment deleted')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-4 group"
      id={`comment-${comment.id}`}
    >
      <div className="flex gap-3">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5`}>
          {comment.profiles?.avatar_url
            ? <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{comment.profiles?.full_name || 'Unknown'}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>@{comment.profiles?.username}</span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{comment.body}</p>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => onReply(comment)} className="btn-ghost text-xs py-1 px-2">
              <Reply className="w-3 h-3" /> Reply
            </button>
            {canDelete && (
              <button onClick={handleDelete} className="btn-ghost text-xs py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#f43f5e' }}>
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="ml-11 mt-3 space-y-2 border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => setExpanded(v => !v)} className="btn-ghost text-xs py-0.5 px-2">
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
          <AnimatePresence>
            {expanded && replies.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <CommentItem comment={r} replies={[]} onReply={onReply} onDelete={onDelete} currentUserId={currentUserId} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
