import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUserId, isInDemoMode } from '@/lib/auth/session'
import { createTransactionSchema } from '@/types/schemas'

/**
 * GET /api/transactions
 * Returns transactions for the current user with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: Record<string, unknown> = { userId }

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1)
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Filter by type if provided
    if (type === 'INCOME' || type === 'EXPENSE') {
      where.type = type
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toNumber(),
        date: t.date.toISOString(),
        paymentMethod: t.paymentMethod,
        source: t.source,
        description: t.description,
        category: t.category,
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      hasMore: offset + transactions.length < total,
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 * Creates a new transaction (expense or income)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Demo users cannot create transactions
    if (await isInDemoMode()) {
      return NextResponse.json(
        { error: 'Demo mode - cannot create transactions. Please login with Google.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('Transaction request body:', JSON.stringify(body, null, 2))

    const validation = createTransactionSchema.safeParse(body)

    if (!validation.success) {
      console.log('Validation error:', JSON.stringify(validation.error.flatten(), null, 2))
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify category belongs to user if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          userId,
          isArchived: false,
        },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found or not accessible' },
          { status: 400 }
        )
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: data.type,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        paymentMethod: data.paymentMethod || null,
        source: data.source || null,
        description: data.description || null,
        categoryId: data.categoryId || null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount.toNumber(),
        date: transaction.date.toISOString(),
        paymentMethod: transaction.paymentMethod,
        source: transaction.source,
        description: transaction.description,
        category: transaction.category,
        createdAt: transaction.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transactions
 * Deletes a transaction by ID (passed as query param)
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Demo users cannot delete transactions
    if (await isInDemoMode()) {
      return NextResponse.json(
        { error: 'Demo mode - cannot delete transactions. Please login with Google.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    // Verify ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    await prisma.transaction.delete({
      where: { id: transactionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
