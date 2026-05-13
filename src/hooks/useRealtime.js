import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Subscribe to a Supabase Realtime channel.
 * @param {string} channelName - Unique channel name
 * @param {object} config      - { event, schema, table, filter, callback }
 * @param {Array}  deps        - useEffect dependency array
 */
export function useRealtime(channelName, { event = '*', schema = 'public', table, filter, callback }, deps = []) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!table) return

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event, schema, table, filter }, (payload) => {
        cbRef.current(payload)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [channelName, event, schema, table, filter, ...deps]) // eslint-disable-line
}

/**
 * Track presence (online users) in a room.
 * @param {string}   room     - Room/channel identifier
 * @param {object}   userData - Metadata to broadcast ({ userId, username })
 * @param {Function} onUpdate - Called with updated presence state
 */
export function usePresence(room, userData, onUpdate) {
  useEffect(() => {
    if (!userData?.userId) return

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
