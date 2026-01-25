import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/assets/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, isLiquid, currency, notes, displayOrder, providerId } = body

    // Verify ownership
    const existing = await prisma.asset.findFirst({
      where: { id },
      include: { provider: { include: { instrument: { include: { assetClass: true } } } } },
    })

    if (!existing || existing.provider.instrument.assetClass.userId !== session.user.id) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const updateData: {
      name?: string
      isLiquid?: boolean
      currency?: string
      notes?: string | null
      displayOrder?: number
      providerId?: string
    } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
      }
      if (name.length > 200) {
        return NextResponse.json({ error: 'Name must be 200 characters or less' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (isLiquid !== undefined) {
      updateData.isLiquid = Boolean(isLiquid)
    }

    if (currency !== undefined) {
      updateData.currency = currency
    }

    if (notes !== undefined) {
      if (notes && notes.length > 1000) {
        return NextResponse.json({ error: 'Notes must be 1000 characters or less' }, { status: 400 })
      }
      updateData.notes = notes?.trim() || null
    }

    if (displayOrder !== undefined) {
      if (typeof displayOrder !== 'number' || displayOrder < 0) {
        return NextResponse.json({ error: 'Invalid displayOrder' }, { status: 400 })
      }
      updateData.displayOrder = displayOrder
    }

    if (providerId !== undefined) {
      const newProvider = await prisma.provider.findFirst({
        where: { id: providerId },
        include: { instrument: { include: { assetClass: true } } },
      })
      if (!newProvider || newProvider.instrument.assetClass.userId !== session.user.id) {
        return NextResponse.json({ error: 'Target provider not found' }, { status: 404 })
      }
      updateData.providerId = providerId
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(asset)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset with this name already exists' }, { status: 409 })
    }
    console.error('Error updating asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/assets/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.asset.findFirst({
      where: { id },
      include: { provider: { include: { instrument: { include: { assetClass: true } } } } },
    })

    if (!existing || existing.provider.instrument.assetClass.userId !== session.user.id) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    await prisma.asset.delete({ where: { id } })

    return NextResponse.json({ message: 'Asset deleted' })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
