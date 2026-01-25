'use client'

import { useState, useEffect, useCallback } from 'react'

interface OnlineStatus {
  isOnline: boolean
  wasOffline: boolean
}

/**
 * Hook to track online/offline status
 * Returns current status and whether user was previously offline (for sync notifications)
 */
export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
  })

  const handleOnline = useCallback(() => {
    setStatus((prev) => ({
      isOnline: true,
      wasOffline: !prev.isOnline, // Track if we were offline before
    }))
  }, [])

  const handleOffline = useCallback(() => {
    setStatus({
      isOnline: false,
      wasOffline: false,
    })
  }, [])

  useEffect(() => {
    // Set initial state
    setStatus({
      isOnline: navigator.onLine,
      wasOffline: false,
    })

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return status
}

/**
 * Hook that triggers a callback when coming back online
 */
export function useOnBackOnline(callback: () => void): void {
  const { isOnline, wasOffline } = useOnlineStatus()

  useEffect(() => {
    if (isOnline && wasOffline) {
      callback()
    }
  }, [isOnline, wasOffline, callback])
}

export default useOnlineStatus
