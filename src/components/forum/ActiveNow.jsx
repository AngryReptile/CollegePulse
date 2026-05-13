import { useState } from 'react'
import { usePresence } from '../../hooks/useRealtime'

export default function ActiveNow({ userId, username }) {
  const [count, setCount] = useState(1)

  usePresence(
    'global-lobby',
    userId ? { userId, username: username || 'Anonymous' } : null,
    (c) => setCount(c)
  )

  return (
    <div className="flex items-center gap-2 px-1 py-2">
      <div className="online-dot" />
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        <span className="text-green-400 font-bold">{count}</span>
        {' '}active now
      </span>
    </div>
  )
}
