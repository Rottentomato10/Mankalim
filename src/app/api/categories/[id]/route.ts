import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUserId } from '@/lib/auth/session'
import { updateCategorySchema } from '@/types/schemas'

/**
 * PATCH /api/categories/[id]
 * Updates a category name
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const category = await prisma.category.findFirst({
      where: { id, userId }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateCategorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: validation.data.name,
        displayOrder: validation.data.displayOrder
      }
    })

    return NextResponse.json({
      success: true,
      category: {
        id: updated.id,
        name: updated.name,
        displayOrder: updated.displayOrder
      }
    })
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories/[id]
 * Deletes a category (sets transactions to null categoryId)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const category = await prisma.category.findFirst({
      where: { id, userId }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Delete the category (transactions will have null categoryId due to SetNull)
    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
