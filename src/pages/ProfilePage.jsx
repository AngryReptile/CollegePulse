import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { generatePortfolioSummary } from '../lib/gemini'
import { generateInitials, getAvatarGradient, timeAgo } from '../lib/utils'
import toast from 'react-hot-toast'
import {
  Github, Linkedin, MapPin, BookOpen, Star, MessageSquare,
  Edit3, Share2, Sparkles, ExternalLink, Image, Plus, X, Check
} from 'lucide-react'

export default function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user, profile: myProfile, updateProfile } = useAuthStore()
  const isOwn = !username || username === myProfile?.username

  const [profile, setProfile]     = useState(null)
  const [posts, setPosts]         = useState([])
  const [threads, setThreads]     = useState([])
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [editing, setEditing]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [editForm, setEditForm]   = useState({})
  const [skillInput, setSkillInput] = useState('')
  const [activeTab, setActiveTab] = useState('posts')

  useEffect(() => {
    loadProfile()
  }, [username, myProfile?.id]) // eslint-disable-line

  async function loadProfile() {
    setLoading(true)
    let data
    if (isOwn) {
      data = myProfile
    } else {
      const { data: d } = await supabase.from('profiles').select('*').eq('username', username).single()
      data = d
    }
    setProfile(data)
    setEditForm({
      full_name:   data?.full_name || '',
      bio:         data?.bio || '',
      department:  data?.department || '',
      year:        data?.year || 1,
      skills:      data?.skills || [],
      github_url:  data?.github_url || '',
      linkedin_url:data?.linkedin_url || '',
    })

    if (data?.id) {
      const [{ data: postData }, { data: threadData }] = await Promise.all([
        supabase.from('posts').select('*').eq('author_id', data.id).order('created_at', { ascending: false }).limit(9),
        supabase.from('forum_threads').select('*').eq('author_id', data.id).order('created_at', { ascending: false }).limit(5),
      ])
      setPosts(postData || [])
      setThreads(threadData || [])
    }
    setLoading(false)
  }

  async function generateAI() {
    if (!profile) return
    setAiLoading(true)
    const summary = await generatePortfolioSummary(profile)
    setAiSummary(summary)
    setAiLoading(false)
  }

  async function saveProfile() {
    const { error } = await updateProfile({ ...editForm })
    if (error) { toast.error('Save failed'); return }
    toast.success('Profile updated!')
    setEditing(false)
    setProfile(p => ({ ...p, ...editForm }))
  }

  function addSkill(e) {
    e.preventDefault()
    if (!skillInput.trim()) return
    setEditForm(f => ({ ...f, skills: [...(f.skills || []), skillInput.trim()] }))
    setSkillInput('')
  }

  function removeSkill(s) {
    setEditForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))
  }

  function sharePorfolio() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Portfolio link copied!')
  }

  if (loading) return <ProfileSkeleton />

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <p style={{ color: 'var(--text-muted)' }}>User not found</p>
    </div>
  )

  const initials  = generateInitials(profile.full_name)
  const gradient  = getAvatarGradient(profile.id)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl font-bold text-white`} style={{ fontFamily: 'Outfit' }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover rounded-2xl" />
                : initials}
            </div>
            {isOwn && editing && (
              <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                <Image className="w-3.5 h-3.5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={() => toast('Avatar upload — connect Supabase Storage')} />
              </label>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                className="glass-input text-xl font-bold mb-2" placeholder="Full name" />
            ) : (
              <h1 className="text-2xl font-display font-bold mb-1">{profile.full_name}</h1>
            )}
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>@{profile.username}</p>

            <div className="flex flex-wrap items-center gap-3 text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              {profile.department && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{profile.department}</span>}
              {profile.year && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Year {profile.year}</span>}
              <span className={`badge ${profile.role === 'admin' ? 'badge-violet' : 'badge-brand'}`}>{profile.role === 'admin' ? '🎓 Faculty/Admin' : '🎒 Student'}</span>
            </div>

            {editing ? (
              <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                className="glass-input resize-none text-sm" rows={3} placeholder="Tell the community about yourself…" />
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {profile.bio || <span style={{ color: 'var(--text-muted)' }}>No bio yet.</span>}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            {isOwn ? (
              <>
                {editing ? (
                  <>
                    <button onClick={saveProfile} className="btn-primary py-2 px-4"><Check className="w-4 h-4" /> Save</button>
                    <button onClick={() => setEditing(false)} className="btn-secondary py-2 px-3"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditing(true)} id="btn-edit-profile" className="btn-secondary py-2 px-4"><Edit3 className="w-4 h-4" /> Edit</button>
                    <button onClick={sharePorfolio} className="btn-ghost py-2 px-3"><Share2 className="w-4 h-4" /></button>
                  </>
                )}
              </>
            ) : (
              <button onClick={() => navigate('/messages?with=' + profile.id)} className="btn-primary py-2 px-4">
                <MessageSquare className="w-4 h-4" /> Message
              </button>
            )}
          </div>
        </div>

        {/* Social links */}
        {(editing || profile.github_url || profile.linkedin_url) && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-white border-opacity-5">
            {editing ? (
              <div className="flex gap-3 w-full">
                <div className="relative flex-1">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input value={editForm.github_url} onChange={e => setEditForm(f => ({ ...f, github_url: e.target.value }))}
                    className="glass-input pl-10 text-sm" placeholder="GitHub URL" />
                </div>
                <div className="relative flex-1">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input value={editForm.linkedin_url} onChange={e => setEditForm(f => ({ ...f, linkedin_url: e.target.value }))}
                    className="glass-input pl-10 text-sm" placeholder="LinkedIn URL" />
                </div>
              </div>
            ) : (
              <>
                {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm py-1.5"><Github className="w-4 h-4" /> GitHub <ExternalLink className="w-3 h-3 opacity-50" /></a>}
                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm py-1.5"><Linkedin className="w-4 h-4" /> LinkedIn <ExternalLink className="w-3 h-3 opacity-50" /></a>}
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* Skills */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="glass-card p-5">
        <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Skills</h2>
        <div className="flex flex-wrap gap-2">
          {(editing ? editForm.skills : profile.skills || []).map(skill => (
            <span key={skill} className="badge badge-brand">
              {skill}
              {editing && <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-400"><X className="w-3 h-3" /></button>}
            </span>
          ))}
          {(!editing && !(profile.skills?.length)) && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No skills added</span>}
          {editing && (
            <form onSubmit={addSkill} className="flex gap-2">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)} className="glass-input text-sm py-1" style={{ width: 120 }} placeholder="Add skill…" />
              <button type="submit" className="btn-ghost p-1"><Plus className="w-4 h-4" /></button>
            </form>
          )}
        </div>
      </motion.div>

      {/* AI Portfolio Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="glass-card p-5"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(124,58,237,0.06))', borderColor: 'rgba(124,58,237,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" /> AI Portfolio Summary
          </h2>
          {(isOwn || !aiSummary) && (
            <button id="btn-generate-ai" onClick={generateAI} disabled={aiLoading} className="btn-secondary text-xs py-1.5 px-3">
              {aiLoading ? '✨ Generating…' : '✨ Generate'}
            </button>
          )}
        </div>
        {aiSummary ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aiSummary}</p>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
            Click "Generate" to create your AI-powered professional summary using your profile data.
          </p>
        )}
      </motion.div>

      {/* Tabs: Posts / Forum Threads */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <div className="flex gap-1 mb-4 p-1 rounded-xl inline-flex" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['posts', 'threads'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'text-white' : ''}`}
              style={activeTab === tab ? { background: 'rgba(255,255,255,0.1)' } : { color: 'var(--text-muted)' }}
            >
              {tab === 'posts' ? `📸 Posts (${posts.length})` : `💬 Threads (${threads.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'posts' ? (
          <div className="grid grid-cols-3 gap-3">
            {posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="aspect-square rounded-2xl overflow-hidden cursor-pointer relative group glass-card p-0">
                {post.image_url ? (
                  <img src={post.image_url} alt={post.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>{post.caption}</div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium">❤️ {post.likes_count}</span>
                </div>
              </motion.div>
            ))}
            {posts.length === 0 && <p className="col-span-3 text-center py-8" style={{ color: 'var(--text-muted)' }}>No posts yet.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread, i) => (
              <motion.div key={thread.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/forum/${thread.id}`)}
                className="glass-card p-4 cursor-pointer hover:border-blue-500/30 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-sm mb-1">{thread.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(thread.tags || []).slice(0, 3).map(t => <span key={t} className="badge badge-brand text-xs">{t}</span>)}
                    </div>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(thread.created_at)}</span>
                </div>
              </motion.div>
            ))}
            {threads.length === 0 && <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No threads yet.</p>}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <div className="flex gap-6">
          <div className="skeleton w-24 h-24 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-7 w-48" />
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
      </div>
      <div className="glass-card p-5"><div className="skeleton h-5 w-24 mb-3" /><div className="flex gap-2">{[1,2,3].map(i => <div key={i} className="skeleton h-7 w-20 rounded-full" />)}</div></div>
    </div>
  )
}
