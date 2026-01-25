import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        defaultCurrency: true,
        notifyEnabled: true,
        notifyDay: true,
        deletedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      defaultCurrency: user.defaultCurrency,
      notifyEnabled: user.notifyEnabled,
      notifyDay: user.notifyDay,
      deletionPending: !!user.deletedAt,
      deletionDate: user.deletedAt,
    })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { defaultCurrency, notifyEnabled, notifyDay } = body

    // Validate input
    if (defaultCurrency !== undefined && typeof defaultCurrency !== 'string') {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }

    if (notifyEnabled !== undefined && typeof notifyEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid notifyEnabled' }, { status: 400 })
    }

    if (notifyDay !== undefined) {
      if (typeof notifyDay !== 'number' || notifyDay < 1 || notifyDay > 28) {
        return NextResponse.json(
          { error: 'notifyDay must be between 1 and 28' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: {
      defaultCurrency?: string
      notifyEnabled?: boolean
      notifyDay?: number
    } = {}

    if (defaultCurrency !== undefined) updateData.defaultCurrency = defaultCurrency
    if (notifyEnabled !== undefined) updateData.notifyEnabled = notifyEnabled
    if (notifyDay !== undefined) updateData.notifyDay = notifyDay

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        defaultCurrency: true,
        notifyEnabled: true,
        notifyDay: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
