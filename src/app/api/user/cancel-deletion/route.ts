import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/demo-auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const authSession = await getAuthSession()

    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (authSession.isDemo) {
      return NextResponse.json({ error: 'Demo mode - cannot cancel deletion' }, { status: 403 })
    }

    const session = authSession
    // Check if deletion is pending
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { deletedAt: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.deletedAt) {
      return NextResponse.json(
        { error: 'No pending deletion to cancel' },
        { status: 400 }
      )
    }

    // Clear the deletedAt field
    await prisma.user.update({
      where: { id: session.user.id },
      data: { deletedAt: null },
    })

    return NextResponse.json({
      message: 'Account deletion cancelled',
      deletionPending: false,
    })
  } catch (error) {
    console.error('Error cancelling deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
