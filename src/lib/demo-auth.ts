import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'

export interface DemoUser {
  id: string
  email: string
  name: string
  image: string | null
  defaultCurrency: string
  notifyEnabled: boolean
  notifyDay: number
}

export async function getDemoSession(): Promise<{ user: DemoUser } | null> {
  try {
    const cookieStore = await cookies()
    const demoCookie = cookieStore.get('demo-session')

    if (!demoCookie?.value) {
      return null
    }

    const user = JSON.parse(demoCookie.value) as DemoUser
    return { user }
  } catch {
    return null
  }
}

export function isDemoUser(userId: string): boolean {
  return userId === 'demo-user-123' || userId === 'demo-user-001'
}

// Demo cookie name
const DEMO_COOKIE_NAME = 'demo-session'

/**
 * Create demo session for a user
 */
export async function createDemoSession(user: {
  id: string
  email: string | null
  name: string | null
}): Promise<void> {
  const cookieStore = await cookies()

  const sessionData: DemoUser = {
    id: user.id,
    email: user.email || 'demo@menakalim.app',
    name: user.name || 'משתמש',
    image: null,
    defaultCurrency: 'ILS',
    notifyEnabled: false,
    notifyDay: 1,
  }

  cookieStore.set(DEMO_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
}

/**
 * Destroy demo session
 */
export async function destroyDemoSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DEMO_COOKIE_NAME)
}

/**
 * Get the current user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getAuthSession()
  return session?.user?.id || null
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId()
  return userId !== null
}

/**
 * Check if user is in demo mode
 */
export async function isInDemoMode(): Promise<boolean> {
  const session = await getAuthSession()
  return session?.isDemo || false
}

// Combined auth helper that checks both real session and demo session
export async function getAuthSession(): Promise<{
  user: {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
    defaultCurrency?: string
  }
  isDemo: boolean
} | null> {
  // First check real auth session
  const session = await auth()
  if (session?.user?.id) {
    return {
      user: session.user,
      isDemo: false,
    }
  }

  // Fall back to demo session
  const demoSession = await getDemoSession()
  if (demoSession?.user) {
    return {
      user: demoSession.user,
      isDemo: true,
    }
  }

  return null
}
