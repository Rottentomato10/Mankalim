import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUserId, isInDemoMode } from '@/lib/auth/session'
import { updateTransactionSchema } from '@/types/schemas'

/**
 * GET /api/transactions/[id]
 * Get a single transaction by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount.toNumber(),
        date: transaction.date.toISOString().split('T')[0],
        paymentMethod: transaction.paymentMethod,
        source: transaction.source,
        description: transaction.description,
        category: transaction.category,
        categoryId: transaction.categoryId
      }
    })
  } catch (error) {
    console.error('Get transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/transactions/[id]
 * Update a transaction
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

    // Demo users cannot update transactions
    if (await isInDemoMode()) {
      return NextResponse.json(
        { error: 'Demo mode - cannot update transactions. Please login with Google.' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateTransactionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify category belongs to user if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId, isArchived: false }
      })
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount: data.amount,
        date: data.date ? new Date(data.date) : undefined,
        paymentMethod: data.paymentMethod,
        source: data.source,
        description: data.description,
        categoryId: data.categoryId
      },
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: updated.id,
        type: updated.type,
        amount: updated.amount.toNumber(),
        date: updated.date.toISOString().split('T')[0],
        paymentMethod: updated.paymentMethod,
        source: updated.source,
        description: updated.description,
        category: updated.category
      }
    })
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}
