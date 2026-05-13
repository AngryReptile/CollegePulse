import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import CountdownTimer from './CountdownTimer'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { MapPin, CalendarDays, Users, Ticket, Clock } from 'lucide-react'

export default function EventBentoCard({ event, index = 0, onRsvp, rsvped }) {
  const { user } = useAuthStore()

  async function handleRsvp() {
    if (!user) { toast.error('Sign in to RSVP'); return }
    if (rsvped) { toast('You already have a ticket! 🎟️'); return }

    const ticketCode = `EVT-${event.id.slice(0,6)}-${user.id.slice(0,6)}-${Date.now().toString(36).toUpperCase()}`

    const { error } = await supabase.from('event_rsvps').insert({
      event_id:    event.id,
      user_id:     user.id,
      ticket_code: ticketCode,
    })
    if (error) {
      if (error.code === '23505') toast.error('Already RSVPed!')
      else toast.error(error.message)
      return
    }
    toast.success('🎟️ Ticket saved to your wallet!')
    onRsvp?.()
  }

  const isFeatured = index === 0
  const eventDate  = new Date(event.event_date)
  const isPast     = eventDate < new Date()

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -3 }}
      className={`glass-card overflow-hidden ${isFeatured ? 'md:col-span-2' : ''}`}
      id={`event-${event.id}`}
    >
      {/* Banner image */}
      {event.banner_url && (
        <div className="w-full overflow-hidden" style={{ height: isFeatured ? 220 : 160 }}>
          <motion.img src={event.banner_url} alt={event.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      {!event.banner_url && (
        <div className="w-full flex items-center justify-center"
          style={{ height: isFeatured ? 140 : 100, background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.15))' }}>
          <CalendarDays className="w-12 h-12 opacity-20" />
        </div>
      )}

      <div className="p-4">
        {/* Title */}
        <h2 className={`font-display font-bold mb-1 ${isFeatured ? 'text-lg' : 'text-base'}`}>{event.title}</h2>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
          {event.description?.slice(0, isFeatured ? 200 : 100)}{event.description?.length > (isFeatured ? 200 : 100) ? '…' : ''}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{format(eventDate, 'MMM d, yyyy')}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(eventDate, 'h:mm a')}</span>
          {event.venue && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.venue}</span>}
          {event.max_attendees && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Max {event.max_attendees}</span>}
        </div>

        {/* Countdown */}
        {!isPast && (
          <div className="mb-4">
            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>Starts in</p>
            <CountdownTimer targetDate={event.event_date} />
          </div>
        )}

        {/* RSVP */}
        <div className="flex items-center gap-3">
          <motion.button
            id={`btn-rsvp-${event.id}`}
            onClick={handleRsvp}
            disabled={rsvped || isPast}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all ${
              rsvped ? 'badge-green border border-green-500/30 cursor-default' :
              isPast  ? 'btn-secondary opacity-50 cursor-not-allowed' :
              'btn-primary'
            }`}
          >
            <Ticket className="w-4 h-4" />
            {rsvped ? 'Ticket Saved ✓' : isPast ? 'Event Ended' : 'Get Ticket'}
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}
