import { NextResponse } from 'next/server'
import { createDemoSession, destroyDemoSession } from '@/lib/demo-auth'

// Demo user data
const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@maazanim.app',
  name: 'משתמש דמו',
  image: null,
}

// POST /api/auth/demo - Create demo session
export async function POST() {
  await createDemoSession(DEMO_USER)

  return NextResponse.json({
    success: true,
    user: {
      ...DEMO_USER,
      defaultCurrency: 'ILS',
      notifyEnabled: false,
      notifyDay: 1,
    }
  })
}

// DELETE /api/auth/demo - Clear demo session
export async function DELETE() {
  await destroyDemoSession()
  return NextResponse.json({ success: true })
}
