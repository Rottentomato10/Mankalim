import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/assets/instruments - Create new instrument
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assetClassId, name } = body

    if (!assetClassId || typeof assetClassId !== 'string') {
      return NextResponse.json({ error: 'assetClassId is required' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
    }

    // Verify asset class ownership
    const assetClass = await prisma.assetClass.findFirst({
      where: { id: assetClassId, userId: session.user.id },
    })

    if (!assetClass) {
      return NextResponse.json({ error: 'Asset class not found' }, { status: 404 })
    }

    // Get max display order
    const maxOrder = await prisma.instrument.aggregate({
      where: { assetClassId },
      _max: { displayOrder: true },
    })

    const instrument = await prisma.instrument.create({
      data: {
        assetClassId,
        name: name.trim(),
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
      include: {
        providers: {
          include: {
            assets: true,
          },
        },
      },
    })

    return NextResponse.json(instrument, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Instrument with this name already exists in this asset class' }, { status: 409 })
    }
    console.error('Error creating instrument:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
