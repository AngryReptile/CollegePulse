import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import PostCard from '../components/feed/PostCard'
import NewPostModal from '../components/feed/NewPostModal'
import { Plus, Image, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FeedPage() {
  const { user } = useAuthStore()
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [page, setPage]         = useState(0)
  const [hasMore, setHasMore]   = useState(true)
  const PAGE_SIZE = 10

  useEffect(() => { loadPosts(0, true) }, []) // eslint-disable-line

  const loadPosts = useCallback(async (pg = 0, reset = false) => {
    setLoading(true)
    const from = pg * PAGE_SIZE
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles:author_id(id, full_name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) { toast.error('Failed to load feed'); setLoading(false); return }

    // Enrich with like status
    let enriched = data || []
    if (user) {
      const ids = enriched.map(p => p.id)
      if (ids.length) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', ids)
        const likedSet = new Set((likes || []).map(l => l.post_id))
        enriched = enriched.map(p => ({ ...p, liked_by_me: likedSet.has(p.id) }))
      }
    }

    if (reset) setPosts(enriched)
    else setPosts(prev => [...prev, ...enriched])

    setHasMore(enriched.length === PAGE_SIZE)
    setLoading(false)
  }, [user])

  async function toggleLike(post) {
    if (!user) { toast.error('Sign in to like posts'); return }
    const wasLiked = post.liked_by_me
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, liked_by_me: !wasLiked, likes_count: p.likes_count + (wasLiked ? -1 : 1) }
      : p
    ))
    if (wasLiked) {
      await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: user.id })
      await supabase.from('posts').update({ likes_count: Math.max(0, post.likes_count - 1) }).eq('id', post.id)
    } else {
      await supabase.from('post_likes').upsert({ post_id: post.id, user_id: user.id })
      await supabase.from('posts').update({ likes_count: post.likes_count + 1 }).eq('id', post.id)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl">Campus Feed</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Photos and updates from campus</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadPosts(0, true)} className="btn-secondary py-2 px-3">
            <RefreshCw className="w-4 h-4" />
          </button>
          {user && (
            <motion.button id="btn-new-post" onClick={() => setShowNew(true)} whileTap={{ scale: 0.96 }} className="btn-primary">
              <Plus className="w-4 h-4" /> Post
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Feed */}
      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <FeedSkeleton key={i} />)}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} onLikeToggle={toggleLike} />
            ))}
          </AnimatePresence>

          {posts.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
              <Image className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium mb-1">No posts yet</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Be the first to share something!</p>
              {user && <button onClick={() => setShowNew(true)} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Create Post</button>}
            </motion.div>
          )}

          {hasMore && posts.length > 0 && (
            <div className="text-center pt-4">
              <button
                id="btn-load-more"
                onClick={() => { const np = page + 1; setPage(np); loadPosts(np) }}
                disabled={loading}
                className="btn-secondary"
              >
                {loading ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showNew && <NewPostModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); loadPosts(0, true) }} userId={user?.id} />}
      </AnimatePresence>
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2"><div className="skeleton h-4 w-32" /><div className="skeleton h-3 w-20" /></div>
      </div>
      <div className="skeleton w-full" style={{ height: 240 }} />
      <div className="p-4 space-y-2"><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-3/4" /></div>
    </div>
  )
}
