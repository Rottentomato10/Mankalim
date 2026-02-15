'use client'

import { useState } from 'react'

interface NotificationToggleProps {
  enabled: boolean
  notifyDay: number
  onEnabledChange: (enabled: boolean) => void
  onNotifyDayChange: (day: number) => void
  disabled?: boolean
}

export function NotificationToggle({
  enabled,
  notifyDay,
  onEnabledChange,
  onNotifyDayChange,
  disabled = false,
}: NotificationToggleProps) {
  const [isPending, setIsPending] = useState(false)

  const handleToggle = async () => {
    if (disabled || isPending) return

    // Check if notifications are supported
    if (!('Notification' in window)) {
      alert('הדפדפן שלכם לא תומך בהתראות')
      return
    }

    if (!enabled) {
      // Request permission
      setIsPending(true)
      try {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          onEnabledChange(true)
        } else {
          alert('יש לאשר התראות כדי לקבל תזכורות')
        }
      } finally {
        setIsPending(false)
      }
    } else {
      onEnabledChange(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-accent"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">תזכורת עדכון חודשית</p>
            <p className="text-white/50 text-xs">קבל התראה לעדכן את המאזן</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={disabled || isPending}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            disabled || isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${enabled ? 'bg-accent' : 'bg-white/20'}`}
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
              enabled ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Day selector */}
      {enabled && (
        <div className="pr-13 space-y-2">
          <label className="text-white/70 text-sm">יום בחודש לתזכורת</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={28}
              value={notifyDay}
              onChange={(e) => onNotifyDayChange(parseInt(e.target.value))}
              disabled={disabled}
              className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent disabled:opacity-50"
            />
            <span className="w-8 text-center text-white font-medium">{notifyDay}</span>
          </div>
          <p className="text-white/40 text-xs">
            תקבל תזכורת בכל {notifyDay} לחודש
          </p>
        </div>
      )}
    </div>
  )
}

export default NotificationToggle
