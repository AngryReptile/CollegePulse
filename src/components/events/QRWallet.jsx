import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { format } from 'date-fns'
import { Download, Ticket, CalendarDays, MapPin } from 'lucide-react'

export default function QRWallet({ tickets }) {
  if (!tickets.length) {
    return (
      <div className="glass-card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        <Ticket className="w-10 h-10 mx-auto mb-3 opacity-20" />
        <p className="font-medium text-sm">No tickets yet</p>
        <p className="text-xs mt-1">RSVP to an event to get your QR ticket</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tickets.map((ticket, i) => (
        <TicketCard key={ticket.ticket_code} ticket={ticket} index={i} />
      ))}
    </div>
  )
}

function TicketCard({ ticket, index }) {
  const event = ticket.events
  const eventDate = event ? new Date(event.event_date) : null

  function downloadQR() {
    const svg = document.getElementById(`qr-${ticket.ticket_code}`)
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas  = document.createElement('canvas')
    canvas.width  = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 256, 256)
      ctx.drawImage(img, 0, 0, 256, 256)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `ticket-${ticket.ticket_code}.png`
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
      className="glass-card overflow-hidden"
      id={`ticket-${ticket.ticket_code}`}
      style={{ borderColor: 'rgba(37,99,235,0.2)', background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(124,58,237,0.05))' }}
    >
      {/* Top strip */}
      <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />

      <div className="p-5 flex gap-5 items-start">
        {/* QR Code */}
        <div className="flex-shrink-0 p-3 rounded-xl" style={{ background: 'white' }}>
          <QRCodeSVG
            id={`qr-${ticket.ticket_code}`}
            value={ticket.ticket_code}
            size={96}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Ticket info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>🎟 YOUR TICKET</p>
          <h3 className="font-display font-bold text-base leading-tight mb-2">{event?.title || 'Event'}</h3>

          {eventDate && (
            <p className="text-xs flex items-center gap-1 mb-1" style={{ color: 'var(--text-secondary)' }}>
              <CalendarDays className="w-3.5 h-3.5" />{format(eventDate, 'EEE, MMM d · h:mm a')}
            </p>
          )}
          {event?.venue && (
            <p className="text-xs flex items-center gap-1 mb-3" style={{ color: 'var(--text-secondary)' }}>
              <MapPin className="w-3.5 h-3.5" />{event.venue}
            </p>
          )}

          <p className="font-mono text-xs mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {ticket.ticket_code}
          </p>

          <button onClick={downloadQR} className="btn-ghost text-xs py-1.5 px-3">
            <Download className="w-3 h-3" /> Save QR
          </button>
        </div>
      </div>

      {/* Dashed separator */}
      <div className="mx-5 border-t border-dashed" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <div className="px-5 py-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="badge badge-green">Valid</div>
        <span>Show QR at entrance for entry</span>
      </div>
    </motion.div>
  )
}
