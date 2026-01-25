import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUserId } from '@/lib/auth/session'

function isDemo(userId: string): boolean {
  return userId === 'demo-user-123' || userId.startsWith('demo-')
}

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'דיור', displayOrder: 1 },
  { id: 'cat-2', name: 'מזון', displayOrder: 2 },
  { id: 'cat-3', name: 'תחבורה', displayOrder: 3 },
  { id: 'cat-4', name: 'בילויים', displayOrder: 4 },
  { id: 'cat-5', name: 'קניות', displayOrder: 5 },
  { id: 'cat-6', name: 'מתנות', displayOrder: 6 },
  { id: 'cat-7', name: 'חסכון', displayOrder: 7 },
  { id: 'cat-8', name: 'אחר', displayOrder: 8 },
]

/**
 * GET /api/categories
 * Returns all active categories for the current user
 * Creates default categories if user has none
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For demo users, return mock categories
    if (isDemo(userId)) {
      return NextResponse.json({ categories: DEFAULT_CATEGORIES })
    }

    let categories = await prisma.category.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: {
        displayOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        displayOrder: true,
      },
    })

    // If user has no categories, create default ones
    if (categories.length === 0) {
      console.log(`Creating default categories for user: ${userId}`)
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map(cat => ({
          userId,
          name: cat.name,
          displayOrder: cat.displayOrder,
        })),
        skipDuplicates: true,
      })

      // Fetch the newly created categories
      categories = await prisma.category.findMany({
        where: {
          userId,
          isArchived: false,
        },
        orderBy: {
          displayOrder: 'asc',
        },
        select: {
          id: true,
          name: true,
          displayOrder: true,
        },
      })
    }

    // Deduplicate by name (in case of race conditions)
    const uniqueCategories = categories.filter((cat, index, self) =>
      index === self.findIndex(c => c.name === cat.name)
    )

    return NextResponse.json({ categories: uniqueCategories })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 * Creates a new category
 */
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Demo users can't create categories
    if (isDemo(userId)) {
      return NextResponse.json({ error: 'Demo mode - cannot create categories' }, { status: 403 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Get the max display order
    const maxOrder = await prisma.category.findFirst({
      where: { userId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    })

    const category = await prisma.category.create({
      data: {
        userId,
        name: name.trim(),
        displayOrder: (maxOrder?.displayOrder || 0) + 1,
      },
      select: {
        id: true,
        name: true,
        displayOrder: true,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
