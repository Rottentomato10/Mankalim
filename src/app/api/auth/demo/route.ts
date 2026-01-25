import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Demo user data
const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@maazanim.app',
  name: 'משתמש דמו',
  image: null,
  defaultCurrency: 'ILS',
  notifyEnabled: false,
  notifyDay: 1,
}

// POST /api/auth/demo - Create demo session
export async function POST() {
  const cookieStore = await cookies()

  // Set demo session cookie
  cookieStore.set('demo-session', JSON.stringify(DEMO_USER), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return NextResponse.json({ success: true, user: DEMO_USER })
}

// DELETE /api/auth/demo - Clear demo session
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('demo-session')
  return NextResponse.json({ success: true })
}
