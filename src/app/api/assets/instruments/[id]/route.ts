import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/assets/instruments/[id]
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
    const { name, displayOrder, assetClassId } = body

    // Verify ownership through asset class
    const existing = await prisma.instrument.findFirst({
      where: { id },
      include: { assetClass: true },
    })

    if (!existing || existing.assetClass.userId !== session.user.id) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 })
    }

    const updateData: { name?: string; displayOrder?: number; assetClassId?: string } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (displayOrder !== undefined) {
      if (typeof displayOrder !== 'number' || displayOrder < 0) {
        return NextResponse.json({ error: 'Invalid displayOrder' }, { status: 400 })
      }
      updateData.displayOrder = displayOrder
    }

    if (assetClassId !== undefined) {
      // Verify new asset class ownership
      const newAssetClass = await prisma.assetClass.findFirst({
        where: { id: assetClassId, userId: session.user.id },
      })
      if (!newAssetClass) {
        return NextResponse.json({ error: 'Target asset class not found' }, { status: 404 })
      }
      updateData.assetClassId = assetClassId
    }

    const instrument = await prisma.instrument.update({
      where: { id },
      data: updateData,
      include: {
        providers: {
          include: {
            assets: true,
          },
        },
      },
    })

    return NextResponse.json(instrument)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Instrument with this name already exists' }, { status: 409 })
    }
    console.error('Error updating instrument:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/assets/instruments/[id]
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

    const existing = await prisma.instrument.findFirst({
      where: { id },
      include: { assetClass: true },
    })

    if (!existing || existing.assetClass.userId !== session.user.id) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 })
    }

    await prisma.instrument.delete({ where: { id } })

    return NextResponse.json({ message: 'Instrument deleted' })
  } catch (error) {
    console.error('Error deleting instrument:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
