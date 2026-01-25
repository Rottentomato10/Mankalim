import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ReorderItem {
  id: string
  displayOrder: number
}

// POST /api/assets/reorder - Reorder items
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, items } = body as { type: string; items: ReorderItem[] }

    if (!type || !['assetClass', 'instrument', 'provider', 'asset'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
    }

    // Validate items
    for (const item of items) {
      if (!item.id || typeof item.displayOrder !== 'number') {
        return NextResponse.json({ error: 'Invalid item format' }, { status: 400 })
      }
    }

    // Update based on type
    switch (type) {
      case 'assetClass': {
        // Verify all asset classes belong to user
        const assetClasses = await prisma.assetClass.findMany({
          where: {
            id: { in: items.map((i) => i.id) },
            userId: session.user.id,
          },
        })

        if (assetClasses.length !== items.length) {
          return NextResponse.json({ error: 'Some asset classes not found' }, { status: 404 })
        }

        await prisma.$transaction(
          items.map((item) =>
            prisma.assetClass.update({
              where: { id: item.id },
              data: { displayOrder: item.displayOrder },
            })
          )
        )
        break
      }

      case 'instrument': {
        const instruments = await prisma.instrument.findMany({
          where: { id: { in: items.map((i) => i.id) } },
          include: { assetClass: true },
        })

        if (instruments.length !== items.length) {
          return NextResponse.json({ error: 'Some instruments not found' }, { status: 404 })
        }

        // Verify ownership
        if (instruments.some((i) => i.assetClass.userId !== session.user.id)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        await prisma.$transaction(
          items.map((item) =>
            prisma.instrument.update({
              where: { id: item.id },
              data: { displayOrder: item.displayOrder },
            })
          )
        )
        break
      }

      case 'provider': {
        const providers = await prisma.provider.findMany({
          where: { id: { in: items.map((i) => i.id) } },
          include: { instrument: { include: { assetClass: true } } },
        })

        if (providers.length !== items.length) {
          return NextResponse.json({ error: 'Some providers not found' }, { status: 404 })
        }

        if (providers.some((p) => p.instrument.assetClass.userId !== session.user.id)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        await prisma.$transaction(
          items.map((item) =>
            prisma.provider.update({
              where: { id: item.id },
              data: { displayOrder: item.displayOrder },
            })
          )
        )
        break
      }

      case 'asset': {
        const assets = await prisma.asset.findMany({
          where: { id: { in: items.map((i) => i.id) } },
          include: { provider: { include: { instrument: { include: { assetClass: true } } } } },
        })

        if (assets.length !== items.length) {
          return NextResponse.json({ error: 'Some assets not found' }, { status: 404 })
        }

        if (assets.some((a) => a.provider.instrument.assetClass.userId !== session.user.id)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        await prisma.$transaction(
          items.map((item) =>
            prisma.asset.update({
              where: { id: item.id },
              data: { displayOrder: item.displayOrder },
            })
          )
        )
        break
      }
    }

    return NextResponse.json({ message: 'Reorder successful' })
  } catch (error) {
    console.error('Error reordering items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
