import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { generateInitials, getAvatarGradient, timeAgo } from '../../lib/utils'
import toast from 'react-hot-toast'
import { Heart, MessageSquare, Share2, MessageCircle, ChevronDown, Send, Trash2 } from 'lucide-react'

export default function PostCard({ post, onLikeToggle, onDelete, index = 0 }) {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments]         = useState([])
  const [commentBody, setCommentBody]   = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submitting, setSubmitting]     = useState(false)

  const initials = generateInitials(post.profiles?.full_name || '')
  const gradient = getAvatarGradient(post.author_id)
  const isOwner  = user?.id === post.author_id

  const loadComments = useCallback(async () => {
    if (showComments) { setShowComments(false); return }
    setLoadingComments(true)
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles:author_id(id, full_name, username, avatar_url)')
      .eq('post_id', post.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
      .limit(20)
    setComments(data || [])
    setShowComments(true)
    setLoadingComments(false)
  }, [post.id, showComments])

  async function submitComment(e) {
    e.preventDefault()
    if (!commentBody.trim() || !user) return
    setSubmitting(true)
    const { data, error } = await supabase.from('post_comments').insert({
      post_id: post.id, author_id: user.id, body: commentBody.trim(),
    }).select('*, profiles:author_id(id, full_name, username, avatar_url)').single()
    setSubmitting(false)
    if (error) { toast.error('Failed to comment'); return }
    setComments(prev => [...prev, data])
    setCommentBody('')
  }

  async function deleteComment(commentId) {
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
    if (error) { toast.error('Failed to delete comment'); return }
    setComments(prev => prev.filter(c => c.id !== commentId))
    toast.success('Comment deleted')
  }

  async function deletePost() {
    if (!window.confirm('Delete this post?')) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) { toast.error(error.message); return }
    toast.success('Post deleted')
    onDelete?.(post.id)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin + '/feed?post=' + post.id)
    toast.success('Link copied!')
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      className="glass-card overflow-hidden"
      id={`post-${post.id}`}
    >
      {/* Author header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold text-white cursor-pointer flex-shrink-0`}
          onClick={() => navigate(`/profile/${post.profiles?.username}`)}
        >
          {post.profiles?.avatar_url
            ? <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm cursor-pointer hover:text-blue-400 transition-colors leading-none mb-0.5"
            onClick={() => navigate(`/profile/${post.profiles?.username}`)}>
            {post.profiles?.full_name || 'Unknown'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(post.created_at)}</p>
        </div>
        <div className="flex items-center gap-1">
          {!isOwner && (
            <button onClick={() => navigate('/messages?with=' + post.author_id)} className="btn-ghost text-xs py-1.5 px-3">
              <MessageSquare className="w-3.5 h-3.5" /> Message
            </button>
          )}
          {isOwner && (
            <button onClick={deletePost} className="btn-ghost text-xs py-1.5 px-2" style={{ color: '#f43f5e' }} title="Delete post">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="px-4 pb-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {post.caption}
        </p>
      )}

      {/* Image — Instagram 4:5 ratio */}
      {post.image_url && (
        <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '4/5' }}>
          <img
            src={post.image_url}
            alt={post.caption || 'Post image'}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <motion.button
          id={`like-${post.id}`}
          className={`like-btn ${post.liked_by_me ? 'liked' : ''}`}
          onClick={() => onLikeToggle(post)}
          whileTap={{ scale: 0.85 }}
        >
          <motion.span
            animate={post.liked_by_me ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
          </motion.span>
          {post.likes_count || 0}
        </motion.button>

        <button
          id={`comment-toggle-${post.id}`}
          onClick={loadComments}
          className="btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5"
          style={{ color: showComments ? 'var(--brand-light)' : 'rgba(255,255,255,0.5)' }}
        >
          {loadingComments ? <span className="animate-spin">⟳</span> : <MessageCircle className="w-4 h-4" />}
          <span>{post.comment_count || 0}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showComments ? 'rotate-180' : ''}`} />
        </button>

        <button onClick={copyLink} className="btn-ghost text-sm py-1.5 px-3 ml-auto">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="px-4 py-3 space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3 group" id={`post-comment-${c.id}`}>
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getAvatarGradient(c.profiles?.id||'')} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {c.profiles?.avatar_url
                      ? <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-lg" />
                      : generateInitials(c.profiles?.full_name || '')}
                  </div>
                  <div className="flex-1" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px' }}>
                    <span className="text-xs font-semibold mr-2">{c.profiles?.full_name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.body}</span>
                  </div>
                  {/* Delete own comment */}
                  {(user?.id === c.author_id || user?.id === post.author_id) && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ color: '#f43f5e' }}
                      title="Delete comment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {comments.length === 0 && <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>No comments yet — be the first!</p>}

              {user && (
                <form onSubmit={submitComment} className="flex gap-2 mt-2">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getAvatarGradient(user.id)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-lg" />
                      : generateInitials(profile?.full_name || '')}
                  </div>
                  <input id={`comment-input-${post.id}`} type="text" value={commentBody} onChange={e => setCommentBody(e.target.value)}
                    className="glass-input text-sm py-1.5 flex-1" placeholder="Add a comment…"
                    onKeyDown={e => e.key === 'Enter' && submitComment(e)} />
                  <button type="submit" disabled={submitting || !commentBody.trim()} className="btn-ghost p-1.5">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
