import { create } from 'zustand'
import { supabase } from '../lib/supabase'
// role is DB-driven only; no email-domain heuristics

export const useAuthStore = create((set, get) => ({
  user:    null,
  profile: null,
  session: null,
  loading: true,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  isAdmin: () => {
    const { profile } = get()
    return profile?.role === 'admin'
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      set({ profile: data })
    }
    return data
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) set({ profile: data })
    return { data, error }
  },
}))
