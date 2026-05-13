import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, uploadImage, BUCKETS } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import EventBentoCard from '../components/events/EventBentoCard'
import QRWallet from '../components/events/QRWallet'
import toast from 'react-hot-toast'
import { Plus, Ticket, CalendarDays, X, Upload, Image, Send } from 'lucide-react'

export default function EventsPage() {
  const { user, isAdmin } = useAuthStore(s => ({ user: s.user, isAdmin: s.isAdmin() }))
  const [events, setEvents]     = useState([])
  const [tickets, setTickets]   = useState([])
  const [myRsvps, setMyRsvps]   = useState(new Set())
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState('events') // 'events' | 'wallet'
  const [showNew, setShowNew]   = useState(false)

  useEffect(() => { fetchAll() }, [user?.id]) // eslint-disable-line

  async function fetchAll() {
    setLoading(true)
    const [{ data: evs }, { data: tix }] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }),
      user ? supabase.from('event_rsvps').select('*, events(*)').eq('user_id', user.id) : { data: [] },
    ])
    setEvents(evs || [])
    setTickets(tix || [])
    setMyRsvps(new Set((tix || []).map(t => t.event_id)))
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl">Events & Tickets</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Fests, workshops, and campus happenings</p>
        </div>
        <div className="flex gap-2">
          {user && (
            <button id="btn-wallet" onClick={() => setView(v => v === 'wallet' ? 'events' : 'wallet')}
              className={`btn-secondary flex items-center gap-2 ${view === 'wallet' ? 'border-blue-500/40 text-blue-400' : ''}`}>
              <Ticket className="w-4 h-4" />
              Wallet {tickets.length > 0 && <span className="badge badge-brand">{tickets.length}</span>}
            </button>
          )}
          {isAdmin && (
            <motion.button id="btn-create-event" onClick={() => setShowNew(true)} whileTap={{ scale: 0.96 }} className="btn-primary">
              <Plus className="w-4 h-4" /> Create Event
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* View toggle */}
      <AnimatePresence mode="wait">
        {view === 'wallet' ? (
          <motion.div key="wallet" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="flex items-center gap-2 mb-5">
              <Ticket className="w-5 h-5 text-blue-400" />
              <h2 className="font-display font-semibold text-lg">My Tickets</h2>
            </div>
            <QRWallet tickets={tickets} />
          </motion.div>
        ) : (
          <motion.div key="events" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="skeleton rounded-2xl" style={{ height: 300 }} />)}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-24" style={{ color: 'var(--text-muted)' }}>
                <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No events yet. {isAdmin ? 'Create the first one!' : 'Check back soon.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((event, i) => (
                  <EventBentoCard key={event.id} event={event} index={i} rsvped={myRsvps.has(event.id)} onRsvp={fetchAll} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Event Modal (Admin only) */}
      <AnimatePresence>
        {showNew && <NewEventModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); fetchAll() }} userId={user?.id} />}
      </AnimatePresence>
    </div>
  )
}

function NewEventModal({ onClose, onCreated, userId }) {
  const [form, setForm] = useState({ title: '', description: '', event_date: '', venue: '', max_attendees: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.title || !form.event_date) { toast.error('Title and date required'); return }
    setLoading(true)

    let banner_url = null
    if (file) {
      try {
        banner_url = await uploadImage(BUCKETS.BANNERS, file, `${userId}/${Date.now()}_${file.name}`)
      } catch (err) { toast.error(err.message); setLoading(false); return }
    }

    const { error } = await supabase.from('events').insert({
      created_by:    userId,
      title:         form.title,
      description:   form.description,
      event_date:    form.event_date,
      venue:         form.venue,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      banner_url,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Event created! 🎉')
    onCreated()
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg">Create Event</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Event Title *</label>
            <input id="event-title" type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="glass-input" placeholder="Annual Tech Fest 2026" required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label>
            <textarea id="event-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="glass-input resize-none" rows={3} placeholder="What's the event about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Date & Time *</label>
              <input id="event-date" type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className="glass-input" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Max Attendees</label>
              <input id="event-max" type="number" value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: e.target.value }))} className="glass-input" placeholder="200" min={1} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Venue</label>
            <input id="event-venue" type="text" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className="glass-input" placeholder="Main Auditorium" />
          </div>

          {/* Banner image */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Banner Image</label>
            <label className={`flex items-center gap-3 p-3 rounded-xl border border-dashed cursor-pointer transition-all ${preview ? 'border-blue-500/30' : 'border-white/10 hover:border-white/20'}`}>
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files[0]
                if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
              }} />
              {preview ? <img src={preview} alt="" className="w-12 h-12 object-cover rounded-lg" /> : <Image className="w-8 h-8 opacity-30" />}
              <div>
                <p className="text-sm">{preview ? 'Change image' : 'Upload banner'}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Images only · Max 5MB</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <motion.button id="btn-create-event-submit" type="submit" disabled={loading} whileTap={{ scale: 0.96 }} className="btn-primary">
              {loading ? 'Creating…' : <><Send className="w-4 h-4" /> Create Event</>}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
