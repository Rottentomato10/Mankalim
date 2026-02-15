import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/demo-auth'

// POST /api/user/activity - Update last active timestamp
export async function POST() {
  try {
    const authSession = await getAuthSession()

    if (!authSession?.user?.id || authSession.isDemo) {
      return NextResponse.json({ ok: true })
    }

    await prisma.user.update({
      where: { id: authSession.user.id },
      data: { lastActiveAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    // Silently fail - activity tracking is not critical
    return NextResponse.json({ ok: true })
  }
}
