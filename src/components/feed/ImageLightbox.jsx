import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function ImageLightbox({ src, alt, onClose }) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="lightbox-backdrop"
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image — stop propagation so clicking image itself doesn't close */}
        <motion.div
          className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          <img
            src={src}
            alt={alt || 'Image'}
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-xl shadow-2xl"
            style={{ display: 'block' }}
          />
        </motion.div>

        {/* Hint */}
        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          Click outside or press Esc to close
        </p>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
