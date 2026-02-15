'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function ActivityTracker() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    const trackActivity = () => {
      fetch('/api/user/activity', { method: 'POST' }).catch(() => {})
    }

    // Track immediately on mount
    trackActivity()

    // Track every 2 minutes while active
    const interval = setInterval(trackActivity, 2 * 60 * 1000)

    // Track on visibility change (when user returns to tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        trackActivity()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [session])

  return null
}
