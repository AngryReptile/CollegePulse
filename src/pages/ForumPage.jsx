import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import ThreadCard from '../components/forum/ThreadCard'
import CommentThread from '../components/forum/CommentThread'
import toast from 'react-hot-toast'
import {
  Search, Plus, X, TrendingUp, Flame, Hash,
  Pin, Tag, ChevronLeft, Send, Filter
} from 'lucide-react'

const CATEGORIES = ['General', 'Academics', 'Events', 'Placements', 'Projects', 'Sports', 'Tech', 'Announcements']

export default function ForumPage() {
  const { user, profile, isAdmin } = useAuthStore(s => ({ user: s.user, profile: s.profile, isAdmin: s.isAdmin() }))
  const [threads, setThreads]       = useState([])
  const [trending, setTrending]     = useState([])
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('All')
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null) // thread detail
  const [showNew, setShowNew]       = useState(false)

  useEffect(() => { fetchThreads() }, [category]) // eslint-disable-line

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('forum_threads')
      .select('*, profiles:author_id(id, full_name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (category !== 'All') q = q.eq('category', category)

    const { data } = await q
    const all = data || []
    setThreads(all)
    // Trending = top 3 by views
    setTrending([...all].sort((a,b) => (b.views||0) - (a.views||0)).slice(0, 3))
    setLoading(false)
  }, [category])

  const filtered = threads.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  )

  async function openThread(thread) {
    setSelected(thread)
    // Increment view count
    await supabase.from('forum_threads').update({ views: (thread.views || 0) + 1 }).eq('id', thread.id)
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl">Discussion Forum</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Connect, ask, and share with the NHCM community</p>
        </div>
        {user && (
          <motion.button id="btn-new-thread" onClick={() => setShowNew(true)} whileTap={{ scale: 0.96 }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Thread
          </motion.button>
        )}
      </motion.div>

      {/* Thread detail view */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="thread-detail"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <button onClick={() => setSelected(null)} className="btn-ghost mb-4">
              <ChevronLeft className="w-4 h-4" /> Back to Forum
            </button>
            <div className="glass-card p-6 mb-6">
              {selected.is_pinned && <span className="badge badge-violet mb-2"><Pin className="w-3 h-3" /> Pinned</span>}
              {selected.category && <span className="badge badge-brand mb-2 ml-2">{selected.category}</span>}
              <h2 className="font-display font-bold text-xl mt-2 mb-3">{selected.title}</h2>
              {selected.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selected.tags.map(t => <span key={t} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>#{t}</span>)}
                </div>
              )}
              <p className="text-sm leading-loose" style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{selected.body}</p>
              {isAdmin && (
                <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <button className="btn-ghost text-xs" onClick={async () => {
                    await supabase.from('forum_threads').update({ is_pinned: !selected.is_pinned }).eq('id', selected.id)
                    toast.success(selected.is_pinned ? 'Unpinned' : 'Pinned!')
                    setSelected(s => ({ ...s, is_pinned: !s.is_pinned }))
                  }}>
                    <Pin className="w-3.5 h-3.5" /> {selected.is_pinned ? 'Unpin' : 'Pin Thread'}
                  </button>
                </div>
              )}
            </div>
            <CommentThread threadId={selected.id} />
          </motion.div>
        )}
      </AnimatePresence>

      {!selected && (
        <>
          {/* Trending */}
          {trending.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
              <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" /> Trending
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {trending.map((t, i) => (
                  <motion.div key={t.id} whileHover={{ scale: 1.02 }} onClick={() => openThread(t)}
                    className="glass-card p-4 cursor-pointer" style={{ borderColor: 'rgba(251,113,133,0.15)' }}>
                    <div className="trending-badge mb-2 inline-flex"><TrendingUp className="w-2.5 h-2.5 mr-1" /> #{i+1} Trending</div>
                    <p className="text-sm font-semibold leading-snug">{t.title}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t.views || 0} views</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Search + Filter */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input id="forum-search" type="text" placeholder="Search threads…" value={search}
                onChange={e => setSearch(e.target.value)} className="glass-input pl-10 text-sm" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['All', ...CATEGORIES].map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${category === c ? 'badge-brand text-blue-300 border border-blue-500/30 bg-blue-500/10' : 'btn-ghost'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Thread list */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((thread, i) => (
                <div key={thread.id} onClick={() => openThread(thread)}>
                  <ThreadCard thread={thread} index={i} isTrending={trending.some(t => t.id === thread.id)} />
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                  <Hash className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No threads found. Start the first one!</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* New Thread Modal */}
      <AnimatePresence>
        {showNew && <NewThreadModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); fetchThreads() }} userId={user?.id} />}
      </AnimatePresence>
    </div>
  )
}

function NewThreadModal({ onClose, onCreated, userId }) {
  const [form, setForm] = useState({ title: '', body: '', category: 'General', tags: '' })
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title required'); return }
    setLoading(true)
    const { error } = await supabase.from('forum_threads').insert({
      author_id: userId,
      title:     form.title.trim(),
      body:      form.body.trim(),
      category:  form.category,
      tags:      form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Thread created! 🎉')
    onCreated()
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg">Create Thread</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Title *</label>
            <input id="thread-title" type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="glass-input" placeholder="What's on your mind?" required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Body</label>
            <textarea id="thread-body" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              className="glass-input resize-none" rows={5} placeholder="Elaborate your thoughts…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Category</label>
              <select id="thread-category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="glass-input appearance-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}><Tag className="w-3 h-3 inline mr-1" />Tags (comma-separated)</label>
              <input id="thread-tags" type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="glass-input" placeholder="react, webdev, help" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <motion.button id="btn-post-thread" type="submit" disabled={loading} whileTap={{ scale: 0.96 }} className="btn-primary">
              {loading ? 'Posting…' : <><Send className="w-4 h-4" /> Post Thread</>}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
