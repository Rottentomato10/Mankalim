import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/assets - Create new asset
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { providerId, name, isLiquid = false, currency = 'ILS', notes } = body

    if (!providerId || typeof providerId !== 'string') {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (name.length > 200) {
      return NextResponse.json({ error: 'Name must be 200 characters or less' }, { status: 400 })
    }

    if (notes && notes.length > 1000) {
      return NextResponse.json({ error: 'Notes must be 1000 characters or less' }, { status: 400 })
    }

    // Verify provider ownership
    const provider = await prisma.provider.findFirst({
      where: { id: providerId },
      include: { instrument: { include: { assetClass: true } } },
    })

    if (!provider || provider.instrument.assetClass.userId !== session.user.id) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Get max display order
    const maxOrder = await prisma.asset.aggregate({
      where: { providerId },
      _max: { displayOrder: true },
    })

    const asset = await prisma.asset.create({
      data: {
        providerId,
        name: name.trim(),
        isLiquid,
        currency,
        notes: notes?.trim() || null,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset with this name already exists in this provider' }, { status: 409 })
    }
    console.error('Error creating asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
