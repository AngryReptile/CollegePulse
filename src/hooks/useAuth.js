import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, profile, session, loading, setSession, setLoading, fetchProfile } = useAuthStore()

  useEffect(() => {
    // Step 1: Fast initial session check (reads from localStorage — instant)
    // This is what actually sets loading → false so pages can render.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        // Fetch profile but DON'T block loading on it —
        // pages can render with user data while profile loads in background
        fetchProfile(session.user.id).catch(() => {}).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => {
      // Network error on session check — unblock loading so pages render
      setLoading(false)
    })

    // Step 2: Listen for subsequent auth changes (login, logout, token refresh)
    // Skip INITIAL_SESSION since step 1 already handles it to avoid double-fetching
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return // handled above
        setSession(session)
        if (session?.user) {
          try { await fetchProfile(session.user.id) } catch {}
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  return { user, profile, session, loading, isAdmin: profile?.role === 'admin' }
}
