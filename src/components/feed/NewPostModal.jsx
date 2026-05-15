import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, uploadImage, BUCKETS } from '../../lib/supabase'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { X, Upload, Image, Send } from 'lucide-react'

export default function NewPostModal({ onClose, onCreated, userId }) {
  const [caption, setCaption] = useState('')
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length) { toast.error('Only image files under 5MB are allowed'); return }
    const f = accepted[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  async function submit(e) {
    e.preventDefault()
    if (!caption.trim() && !file) { toast.error('Add a caption or image'); return }
    setLoading(true)

    let image_url = null
    if (file) {
      try {
        const uid = userId || 'anonymous'
        const path = `${uid}/${Date.now()}_${file.name.replace(/\s/g, '_')}`
        
        // Add a timeout fallback in case of hanging network
        const uploadPromise = uploadImage(BUCKETS.FEED, file, path)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timed out. Check your connection.')), 30000)
        )

        image_url = await Promise.race([uploadPromise, timeoutPromise])
      } catch (err) {
        console.error('[Upload Error]', err)
        toast.error(`Upload failed: ${err.message || 'Unknown error'}`)
        setLoading(false)
        return
      }
    }

    const { error } = await supabase.from('posts').insert({
      author_id: userId,
      caption:   caption.trim(),
      image_url,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Post shared! 📸')
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
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg">New Post</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Image dropzone */}
          <div
            {...getRootProps()}
            className={`rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
            style={{ minHeight: preview ? 'auto' : 180 }}
          >
            <input {...getInputProps()} id="post-image-input" />
            {preview ? (
              <div className="relative w-full">
                <img src={preview} alt="Preview" className="w-full max-h-72 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 btn-ghost p-1.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.6)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(37,99,235,0.15)' }}>
                  {isDragActive ? <Upload className="w-6 h-6 text-blue-400" /> : <Image className="w-6 h-6 text-blue-400" />}
                </div>
                <p className="text-sm font-medium mb-1">{isDragActive ? 'Drop it!' : 'Drag & drop an image'}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>or click to browse · Images only · Max 5MB</p>
              </>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Caption</label>
            <textarea
              id="post-caption"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="glass-input resize-none"
              rows={3}
              placeholder="What's happening on campus? 🎓"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <motion.button
              id="btn-post-submit"
              type="submit"
              disabled={loading || (!file && !caption.trim())}
              whileTap={{ scale: 0.96 }}
              className="btn-primary"
            >
              {loading
                ? <span className="animate-pulse">Uploading…</span>
                : <><Send className="w-4 h-4" /> Share Post</>
              }
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
