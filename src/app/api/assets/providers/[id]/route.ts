import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/assets/providers/[id]
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
    const { name, displayOrder, instrumentId } = body

    // Verify ownership
    const existing = await prisma.provider.findFirst({
      where: { id },
      include: { instrument: { include: { assetClass: true } } },
    })

    if (!existing || existing.instrument.assetClass.userId !== session.user.id) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const updateData: { name?: string; displayOrder?: number; instrumentId?: string } = {}

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

    if (instrumentId !== undefined) {
      const newInstrument = await prisma.instrument.findFirst({
        where: { id: instrumentId },
        include: { assetClass: true },
      })
      if (!newInstrument || newInstrument.assetClass.userId !== session.user.id) {
        return NextResponse.json({ error: 'Target instrument not found' }, { status: 404 })
      }
      updateData.instrumentId = instrumentId
    }

    const provider = await prisma.provider.update({
      where: { id },
      data: updateData,
      include: { assets: true },
    })

    return NextResponse.json(provider)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Provider with this name already exists' }, { status: 409 })
    }
    console.error('Error updating provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/assets/providers/[id]
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

    const existing = await prisma.provider.findFirst({
      where: { id },
      include: { instrument: { include: { assetClass: true } } },
    })

    if (!existing || existing.instrument.assetClass.userId !== session.user.id) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    await prisma.provider.delete({ where: { id } })

    return NextResponse.json({ message: 'Provider deleted' })
  } catch (error) {
    console.error('Error deleting provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
