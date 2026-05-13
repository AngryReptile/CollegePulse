import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import MessageBubble from './MessageBubble'
import { generateInitials, getAvatarGradient } from '../../lib/utils'
import { Send, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ChatWindow({ conversation, otherUser }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!conversation?.id) return
    fetchMessages()
    subscribeRealtime()
    markRead()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [conversation?.id]) // eslint-disable-line

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(id, full_name, username, avatar_url)')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
    scrollBottom()
  }

  function subscribeRealtime() {
    channelRef.current = supabase
      .channel(`chat-${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('messages')
          .select('*, profiles:sender_id(id, full_name, username, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          setMessages(prev => [...prev, data])
          scrollBottom()
          // Mark as read if it's from the other person
          if (data.sender_id !== user?.id) {
            await supabase.from('messages').update({ read: true }).eq('id', data.id)
          }
        }
      })
      .subscribe()
  }

  async function markRead() {
    await supabase.from('messages')
      .update({ read: true })
      .eq('conversation_id', conversation.id)
      .neq('sender_id', user?.id)
  }

  function scrollBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || !user) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      body: input.trim(),
    })
    setSending(false)
    if (error) { toast.error('Failed to send'); return }
    setInput('')
  }

  const gradient = getAvatarGradient(otherUser?.id || '')
  const initials  = generateInitials(otherUser?.full_name || '')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
          {otherUser?.avatar_url
            ? <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-none mb-0.5 truncate">{otherUser?.full_name || 'Unknown'}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>@{otherUser?.username}</p>
        </div>
        <button onClick={() => navigate('/profile/' + otherUser?.username)} className="btn-ghost p-2">
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl font-bold text-white mb-3`}>{initials}</div>
            <p className="text-sm font-medium">{otherUser?.full_name}</p>
            <p className="text-xs mt-1">Start your conversation</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.sender_id === user?.id
          const prev  = messages[i - 1]
          const prevSame = prev?.sender_id === msg.sender_id
          return (
            <MessageBubble key={msg.id} message={msg} isOwn={isOwn} prevSameAuthor={prevSame} />
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-end gap-3 p-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <input
          id="dm-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Message ${otherUser?.full_name?.split(' ')[0] || 'them'}…`}
          className="glass-input flex-1"
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
        />
        <motion.button
          id="btn-send-dm"
          type="submit"
          disabled={sending || !input.trim()}
          whileTap={{ scale: 0.9 }}
          className="btn-primary py-3 px-4 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>
    </div>
  )
}
