import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import ConversationList from '../components/dm/ConversationList'
import ChatWindow from '../components/dm/ChatWindow'
import { MessageSquare, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const { user } = useAuthStore()
  const [params] = useSearchParams()
  const withUserId = params.get('with')

  const [conversations, setConversations] = useState([])
  const [selected, setSelected]           = useState(null)
  const [otherUser, setOtherUser]         = useState(null)
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user?.id]) // eslint-disable-line

  // Handle ?with=userId deep-link (from Message buttons)
  useEffect(() => {
    if (withUserId && user && conversations.length >= 0) {
      openOrCreateConversation(withUserId)
    }
  }, [withUserId, user?.id, conversations.length]) // eslint-disable-line

  async function fetchConversations() {
    setLoading(true)
    try {
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id])
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!convs) return

      // Enrich with other user + last message
      const enriched = await Promise.all(convs.map(async conv => {
        const otherId = conv.participant_ids.find(id => id !== user.id)
        const [{ data: other }, { data: msgs }, { count }] = await Promise.all([
          supabase.from('profiles').select('id, full_name, username, avatar_url').eq('id', otherId).single(),
          supabase.from('messages').select('body, created_at').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1),
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', conv.id).eq('read', false).neq('sender_id', user.id),
        ])
        return { ...conv, other_user: other, last_message: msgs?.[0] || null, unread_count: count || 0 }
      }))

      setConversations(enriched)
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  async function openOrCreateConversation(targetUserId) {
    // Check if conversation already exists
    const existing = conversations.find(c => c.participant_ids.includes(targetUserId))
    if (existing) {
      selectConversation(existing)
      return
    }

    // Create new conversation
    const { data, error } = await supabase.from('conversations').insert({
      participant_ids: [user.id, targetUserId],
    }).select().single()

    if (error) { toast.error('Could not start conversation'); return }

    const { data: other } = await supabase.from('profiles').select('*').eq('id', targetUserId).single()
    const newConv = { ...data, other_user: other, last_message: null, unread_count: 0 }
    setConversations(prev => [newConv, ...prev])
    selectConversation(newConv)
  }

  function selectConversation(conv) {
    setSelected(conv)
    setOtherUser(conv.other_user)
  }

  const filtered = conversations.filter(c =>
    !search || c.other_user?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (!user) return (
    <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
      <p>Sign in to view messages</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-6">Messages</h1>

      <div className="glass-card overflow-hidden flex" style={{ height: 'calc(100vh - 200px)', minHeight: 400 }}>
        {/* Left — conversation list */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <input id="conv-search" type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                className="glass-input pl-8 text-sm py-2" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1,2,3].map(i => <div key={i} className="flex gap-3 p-2"><div className="skeleton w-10 h-10 rounded-xl" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-24" /><div className="skeleton h-3 w-32" /></div></div>)}
              </div>
            ) : (
              <ConversationList conversations={filtered} selectedId={selected?.id} onSelect={selectConversation} />
            )}
          </div>
        </div>

        {/* Right — chat window */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {selected && otherUser ? (
              <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <ChatWindow conversation={selected} otherUser={otherUser} />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(37,99,235,0.1)' }}>
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                </div>
                <p className="font-medium text-sm mb-1">Select a conversation</p>
                <p className="text-xs">Or message someone from their profile</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
