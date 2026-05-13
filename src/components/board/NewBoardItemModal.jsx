import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, uploadImage, BUCKETS } from '../../lib/supabase'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { X, Upload, Image, Send, Users, Search, AlertTriangle } from 'lucide-react'

const CATEGORIES = [
  { value: 'teammate', label: 'Teammate Wanted', icon: Users,         desc: 'Looking for collaborators on a project' },
  { value: 'lost',     label: 'Lost Item',       icon: AlertTriangle, desc: "I lost something on campus" },
  { value: 'found',    label: 'Found Item',      icon: Search,        desc: "I found something on campus" },
]

export default function NewBoardItemModal({ onClose, onCreated, userId }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'teammate', tags: '' })
  const [file, setFile]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxSize: 5 * 1024 * 1024, multiple: false,
  })

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setLoading(true)

    let image_url = null
    if (file) {
      try {
        image_url = await uploadImage(BUCKETS.BOARD, file, `${userId}/${Date.now()}_${file.name}`)
      } catch (err) { toast.error(err.message); setLoading(false); return }
    }

    const { error } = await supabase.from('board_items').insert({
      author_id:   userId,
      category:    form.category,
      title:       form.title.trim(),
      description: form.description.trim(),
      image_url,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Posted to board! 🎯')
    onCreated()
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg">Post to Board</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Category selector */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => {
                const Icon = c.icon
                const active = form.category === c.value
                return (
                  <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, category: c.value }))}
                    className={`rounded-xl p-3 text-left transition-all border ${active ? 'border-blue-500/40 bg-blue-500/10' : 'border-white/08 bg-white/04 hover:bg-white/08'}`}>
                    <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-blue-400' : ''}`} style={active ? {} : { color: 'var(--text-muted)' }} />
                    <p className="text-xs font-medium leading-tight">{c.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Title *</label>
            <input id="board-title" type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="glass-input" placeholder={form.category === 'teammate' ? 'Need a React developer for…' : form.category === 'lost' ? 'Lost my blue water bottle…' : 'Found a wallet near…'} required />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label>
            <textarea id="board-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="glass-input resize-none" rows={3} placeholder="More details…" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Tags</label>
            <input id="board-tags" type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="glass-input" placeholder="react, javascript, hackathon (comma separated)" />
          </div>

          {/* Optional image */}
          <div {...getRootProps()} className={`rounded-xl border border-dashed transition-all cursor-pointer p-4 flex items-center gap-3 ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}>
            <input {...getInputProps()} />
            {preview
              ? <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              : <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}><Image className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></div>
            }
            <div>
              <p className="text-sm font-medium">{preview ? 'Image attached' : 'Add photo (optional)'}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Images only · Max 5MB</p>
            </div>
            {preview && <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }} className="ml-auto btn-ghost p-1"><X className="w-3.5 h-3.5" /></button>}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <motion.button id="btn-post-board" type="submit" disabled={loading} whileTap={{ scale: 0.96 }} className="btn-primary">
              {loading ? 'Posting…' : <><Send className="w-4 h-4" /> Post</>}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
