import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/demo-auth'
import { DEMO_ASSET_CLASSES } from '@/lib/demo-data'

// GET /api/assets/classes - Get all asset classes with nested hierarchy
export async function GET() {
  try {
    const authSession = await getAuthSession()

    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return demo data for demo users
    if (authSession.isDemo) {
      return NextResponse.json(DEMO_ASSET_CLASSES)
    }

    let assetClasses = await prisma.assetClass.findMany({
      where: { userId: authSession.user.id },
      orderBy: { displayOrder: 'asc' },
      include: {
        instruments: {
          orderBy: { displayOrder: 'asc' },
          include: {
            providers: {
              orderBy: { displayOrder: 'asc' },
              include: {
                assets: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    // Create default asset classes if user has none
    if (assetClasses.length === 0) {
      const defaults = [
        { name: 'נדל״ן', instrument: 'דירה להשקעה', provider: 'כללי' },
        { name: 'פנסיוני', instrument: 'קרן פנסיה', provider: 'כללי' },
        { name: 'השקעות', instrument: 'תיק השקעות', provider: 'כללי' },
      ]

      for (let i = 0; i < defaults.length; i++) {
        const def = defaults[i]
        await prisma.assetClass.create({
          data: {
            userId: authSession.user.id,
            name: def.name,
            displayOrder: i,
            instruments: {
              create: {
                name: def.instrument,
                displayOrder: 0,
                providers: {
                  create: {
                    name: def.provider,
                    displayOrder: 0,
                  },
                },
              },
            },
          },
        })
      }

      // Fetch again with the created defaults
      assetClasses = await prisma.assetClass.findMany({
        where: { userId: authSession.user.id },
        orderBy: { displayOrder: 'asc' },
        include: {
          instruments: {
            orderBy: { displayOrder: 'asc' },
            include: {
              providers: {
                orderBy: { displayOrder: 'asc' },
                include: {
                  assets: {
                    orderBy: { displayOrder: 'asc' },
                  },
                },
              },
            },
          },
        },
      })
    }

    return NextResponse.json(assetClasses)
  } catch (error) {
    console.error('Error fetching asset classes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/assets/classes - Create new asset class
export async function POST(request: Request) {
  try {
    const authSession = await getAuthSession()

    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Demo users cannot modify data
    if (authSession.isDemo) {
      return NextResponse.json({ error: 'Demo mode - changes not saved' }, { status: 403 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
    }

    // Get max display order
    const maxOrder = await prisma.assetClass.aggregate({
      where: { userId: authSession.user.id },
      _max: { displayOrder: true },
    })

    const assetClass = await prisma.assetClass.create({
      data: {
        userId: authSession.user.id,
        name: name.trim(),
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
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

    return NextResponse.json(assetClass, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset class with this name already exists' }, { status: 409 })
    }
    console.error('Error creating asset class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
