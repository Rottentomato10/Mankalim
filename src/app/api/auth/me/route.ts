import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthSession, isInDemoMode } from '@/lib/auth/session'

/**
 * GET /api/auth/me
 * Returns the current authenticated user
 */
export async function GET() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      )
    }

    const isDemo = await isInDemoMode()

    // For demo mode, return the session data directly
    if (isDemo) {
      return NextResponse.json({
        authenticated: true,
        isDemo: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
      })
    }

    // Fetch full user data from database for real users
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      isDemo: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { authenticated: false, user: null, error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
