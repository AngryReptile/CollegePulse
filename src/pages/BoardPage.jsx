import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import BoardCard from '../components/board/BoardCard'
import NewBoardItemModal from '../components/board/NewBoardItemModal'
import { Plus, Users, Search, AlertTriangle, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { value: 'all',      label: 'All',            icon: SlidersHorizontal },
  { value: 'teammate', label: 'Teammate Finder', icon: Users },
  { value: 'lost',     label: 'Lost',            icon: AlertTriangle },
  { value: 'found',    label: 'Found',           icon: Search },
]

export default function BoardPage() {
  const { user } = useAuthStore()
  const [items, setItems]     = useState([])
  const [tab, setTab]         = useState('all')
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch]   = useState('')
  const [hideResolved, setHideResolved] = useState(true)

  useEffect(() => { fetchItems() }, [tab]) // eslint-disable-line

  async function fetchItems() {
    setLoading(true)
    try {
      let q = supabase
        .from('board_items')
        .select('*, profiles:author_id(id, full_name, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(40)
      if (tab !== 'all') q = q.eq('category', tab)
      const { data, error } = await q
      if (error) throw error
      setItems(data || [])
    } catch {
      toast.error('Failed to load board')
    } finally {
      setLoading(false)
    }
  }

  function handleResolved(id) {
    // Remove item entirely (handles both resolve and delete)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = items.filter(item => {
    if (hideResolved && item.is_resolved) return false
    if (!search) return true
    return item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      (item.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  })

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl">Community Board</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Find teammates, report lost items, and help your community</p>
        </div>
        {user && (
          <motion.button id="btn-new-board-item" onClick={() => setShowNew(true)} whileTap={{ scale: 0.96 }} className="btn-primary">
            <Plus className="w-4 h-4" /> Post
          </motion.button>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl inline-flex flex-wrap" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.value ? 'text-white' : ''}`}
              style={tab === t.value ? { background: 'rgba(255,255,255,0.1)' } : { color: 'var(--text-muted)' }}
            >
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          )
        })}
      </div>

      {/* Search + options */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input id="board-search" type="text" placeholder="Search board…" value={search} onChange={e => setSearch(e.target.value)} className="glass-input pl-10 text-sm" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer btn-ghost py-2 px-3 text-sm">
          <input type="checkbox" checked={hideResolved} onChange={e => setHideResolved(e.target.checked)} className="rounded" />
          Hide resolved
        </label>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton rounded-2xl" style={{ height: 220 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>Nothing here yet. {user ? 'Post something!' : 'Sign in to post.'}</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <BoardCard key={item.id} item={item} index={i} onResolved={handleResolved} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showNew && <NewBoardItemModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); fetchItems() }} userId={user?.id} />}
      </AnimatePresence>
    </div>
  )
}
