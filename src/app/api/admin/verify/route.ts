import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/demo-auth'

const ADMIN_EMAIL = 'spread.a.wing@gmail.com'
const ADMIN_PASSWORD = 'Freedom1992@@'

// POST /api/admin/verify
export async function POST(request: Request) {
  try {
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
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
