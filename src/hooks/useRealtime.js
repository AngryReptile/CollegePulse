import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Subscribe to a Supabase Realtime channel.
 * Fixed: uses a stable channel ref to prevent channel accumulation on re-renders.
 */
export function useRealtime(channelName, { event = '*', schema = 'public', table, filter, callback }, deps = []) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!table) return

    // Remove any stale channel with the same name before creating a new one
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)
    if (existing) supabase.removeChannel(existing)

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event, schema, table, filter }, (payload) => {
        cbRef.current(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, event, schema, table, filter, ...deps])
}

/**
 * Track presence (online users) in a room.
 */
export function usePresence(room, userData, onUpdate) {
  useEffect(() => {
    if (!userData?.userId) return

    const existing = supabase.getChannels().find(c => c.topic === `realtime:presence:${room}`)
    if (existing) supabase.removeChannel(existing)

    const channel = supabase.channel(`presence:${room}`, {
      config: { presence: { key: userData.userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const count = Object.keys(state).length
        onUpdate?.(count, state)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userData)
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [room, userData?.userId]) // eslint-disable-line
}
