import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set deletedAt to trigger 30-day grace period
    const deletionDate = new Date()
    const finalDeletionDate = new Date(deletionDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    await prisma.user.update({
      where: { id: session.user.id },
      data: { deletedAt: deletionDate },
    })

    return NextResponse.json({
      message: 'Account scheduled for deletion',
      deletionDate: deletionDate,
      finalDeletionDate: finalDeletionDate,
      gracePeriodDays: 30,
    })
  } catch (error) {
    console.error('Error scheduling deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
