'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { SessionProvider, signOut as nextAuthSignOut } from 'next-auth/react'
import type { ReactNode } from 'react'

interface User {
  id: string
  email: string | null
  name: string | null
  image?: string | null
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isDemo: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()

      if (data.authenticated && data.user) {
        setUser(data.user)
        setIsDemo(data.isDemo || false)
      } else {
        setUser(null)
        setIsDemo(false)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
      setIsDemo(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const logout = async () => {
    try {
      if (isDemo) {
        // Demo logout - just clear the cookie
        await fetch('/api/auth/logout', { method: 'POST' })
      } else {
        // NextAuth logout
        await nextAuthSignOut({ redirect: false })
      }
      setUser(null)
      setIsDemo(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isDemo,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
