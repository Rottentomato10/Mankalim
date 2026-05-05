import { cookies } from 'next/headers'
import { createHmac } from 'crypto'
import { auth } from '@/lib/auth'

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return secret
}

function signPayload(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

function createSignedCookie(data: object): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  const signature = signPayload(payload)
  return `${payload}.${signature}`
}

function verifySignedCookie(cookie: string): object | null {
  const dotIndex = cookie.lastIndexOf('.')
  if (dotIndex === -1) return null

  const payload = cookie.slice(0, dotIndex)
  const signature = cookie.slice(dotIndex + 1)

  const expected = signPayload(payload)
  if (signature !== expected) return null

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch {
    return null
  }
}

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

    const data = verifySignedCookie(demoCookie.value)
    if (!data) return null

    const user = data as DemoUser
    return { user }
  } catch {
    return null
  }
}

export function isDemoUser(userId: string): boolean {
  return userId.startsWith('demo-')
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

  cookieStore.set(DEMO_COOKIE_NAME, createSignedCookie(sessionData), {
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
