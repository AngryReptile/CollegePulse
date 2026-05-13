import { useState, useEffect } from 'react'
import { getCountdown } from '../../lib/utils'

export default function CountdownTimer({ targetDate, className = '' }) {
  const [cd, setCd] = useState(getCountdown(targetDate))

  useEffect(() => {
    const id = setInterval(() => setCd(getCountdown(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (cd.expired) {
    return <span className={`text-sm font-medium text-rose-400 ${className}`}>Event Ended</span>
  }

  const units = [
    { val: cd.days,  label: 'Days' },
    { val: cd.hours, label: 'Hrs' },
    { val: cd.mins,  label: 'Min' },
    { val: cd.secs,  label: 'Sec' },
  ]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {units.map(({ val, label }, i) => (
        <div key={label} className="flex flex-col items-center">
          <div className="countdown-digit w-12 h-12 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {String(val).padStart(2, '0')}
          </div>
          <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
