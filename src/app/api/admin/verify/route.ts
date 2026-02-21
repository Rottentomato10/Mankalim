import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/demo-auth'

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

// POST /api/admin/verify
export async function POST(request: Request) {
  try {
    // Ensure admin credentials are configured
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('Admin credentials not configured in environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const authSession = await getAuthSession()

    if (!authSession?.user?.email || authSession.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { password } = body

    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ verified: true })
    }

    return NextResponse.json({ verified: false, error: 'סיסמה שגויה' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
