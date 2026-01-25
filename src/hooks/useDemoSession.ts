'use client'

import { useState, useEffect } from 'react'

interface DemoUser {
  id: string
  email: string
  name: string
  image: string | null
  defaultCurrency: string
  notifyEnabled: boolean
  notifyDay: number
}

export function useDemoSession() {
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for demo session cookie
    const checkDemoSession = () => {
      const cookies = document.cookie.split(';')
      const demoCookie = cookies.find(c => c.trim().startsWith('demo-session='))

      if (demoCookie) {
        try {
          const value = decodeURIComponent(demoCookie.split('=')[1])
          const user = JSON.parse(value)
          setDemoUser(user)
        } catch {
          setDemoUser(null)
        }
      } else {
        setDemoUser(null)
      }
      setIsLoading(false)
    }

    checkDemoSession()
  }, [])

  const signOutDemo = async () => {
    await fetch('/api/auth/demo', { method: 'DELETE' })
    setDemoUser(null)
    window.location.href = '/login'
  }

  return { demoUser, isLoading, signOutDemo }
}
