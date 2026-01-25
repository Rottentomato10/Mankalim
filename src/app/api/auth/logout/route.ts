import { NextResponse } from 'next/server'
import { destroyDemoSession } from '@/lib/auth/session'

/**
 * POST /api/auth/logout
 * Destroys the demo session (NextAuth logout is handled client-side)
 */
export async function POST() {
  try {
    await destroyDemoSession()

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
