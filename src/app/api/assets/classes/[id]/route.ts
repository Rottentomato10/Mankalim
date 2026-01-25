import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/assets/classes/[id] - Update asset class
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
    const { name, displayOrder } = body

    // Verify ownership
    const existing = await prisma.assetClass.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Asset class not found' }, { status: 404 })
    }

    // Build update data
    const updateData: { name?: string; displayOrder?: number } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
      }
      if (name.length > 100) {
        return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (displayOrder !== undefined) {
      if (typeof displayOrder !== 'number' || displayOrder < 0) {
        return NextResponse.json({ error: 'Invalid displayOrder' }, { status: 400 })
      }
      updateData.displayOrder = displayOrder
    }

    const assetClass = await prisma.assetClass.update({
      where: { id },
      data: updateData,
      include: {
        instruments: {
          include: {
            providers: {
              include: {
                assets: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(assetClass)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset class with this name already exists' }, { status: 409 })
    }
    console.error('Error updating asset class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/assets/classes/[id] - Delete asset class with cascade
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

    // Verify ownership
    const existing = await prisma.assetClass.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Asset class not found' }, { status: 404 })
    }

    // Delete with cascade (Prisma handles this based on schema)
    await prisma.assetClass.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Asset class deleted' })
  } catch (error) {
    console.error('Error deleting asset class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
