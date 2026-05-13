import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('[CollegePulse] Supabase credentials not set. Copy .env.example → .env.local and add your keys.')
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseKey  || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
)

// Storage bucket helpers
export const BUCKETS = {
  AVATARS: 'avatars',
  FEED:    'feed-images',
  BANNERS: 'event-banners',
  BOARD:   'board-images',
}

export async function uploadImage(bucket, file, path) {
  // Validate image-only
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed.')
  }
  // 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5MB.')
  }

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export function getAvatarUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const { data } = supabase.storage.from(BUCKETS.AVATARS).getPublicUrl(path)
  return data.publicUrl
}
