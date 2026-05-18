import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, profile, session, loading, setSession, setLoading, fetchProfile } = useAuthStore()

  useEffect(() => {
    // onAuthStateChange fires immediately with the current session on mount
    // (INITIAL_SESSION event), so we don't need a separate getSession() call.
    // Using both causes a race condition where loading flickers to false before
    // the profile is fetched, causing the auth page to flash or not appear.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
        // Always mark loading done after we've handled the event
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  return { user, profile, session, loading, isAdmin: profile?.role === 'admin' }
}
