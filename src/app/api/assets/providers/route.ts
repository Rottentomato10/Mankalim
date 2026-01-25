import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/assets/providers - Create new provider
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { instrumentId, name } = body

    if (!instrumentId || typeof instrumentId !== 'string') {
      return NextResponse.json({ error: 'instrumentId is required' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
    }

    // Verify instrument ownership
    const instrument = await prisma.instrument.findFirst({
      where: { id: instrumentId },
      include: { assetClass: true },
    })

    if (!instrument || instrument.assetClass.userId !== session.user.id) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 })
    }

    // Get max display order
    const maxOrder = await prisma.provider.aggregate({
      where: { instrumentId },
      _max: { displayOrder: true },
    })

    const provider = await prisma.provider.create({
      data: {
        instrumentId,
        name: name.trim(),
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
      include: {
        assets: true,
      },
    })

    return NextResponse.json(provider, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Provider with this name already exists in this instrument' }, { status: 409 })
    }
    console.error('Error creating provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
