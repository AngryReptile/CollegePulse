import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'


export function useAuth() {
  const { user, profile, session, loading, setSession, setLoading, fetchProfile } = useAuthStore()

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  return { user, profile, session, loading, isAdmin: profile?.role === 'admin' }
}
