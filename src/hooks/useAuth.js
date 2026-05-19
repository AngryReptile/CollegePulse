import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, profile, session, loading, setSession, setLoading, fetchProfile } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // Check initial session (reads from local storage or URL hash)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).catch(() => {}).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })

    // Listen to all auth state changes (OAuth redirect triggers SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        setSession(session)
        if (session?.user) {
          // non-blocking fetch
          fetchProfile(session.user.id).catch(() => {})
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line

  return { user, profile, session, loading, isAdmin: profile?.role === 'admin' }
}
