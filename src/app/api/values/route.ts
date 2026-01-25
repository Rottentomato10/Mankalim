import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/demo-auth'
import { DEMO_ASSET_CLASSES, DEMO_VALUES, DEMO_PREVIOUS_VALUES } from '@/lib/demo-data'

// GET /api/values?month=1&year=2026
export async function GET(request: Request) {
  try {
    const authSession = await getAuthSession()

    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '')
    const year = parseInt(searchParams.get('year') || '')

    if (!month || !year || month < 1 || month > 12 || year < 2000) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 })
    }

    // Return demo values for demo users
    if (authSession.isDemo) {
      const assetIds = Object.keys(DEMO_VALUES)
      let currentTotal = 0
      let previousTotal = 0

      const values = assetIds.map((assetId) => {
        const value = DEMO_VALUES[assetId] || '0'
        const prevValue = DEMO_PREVIOUS_VALUES[assetId] || '0'
        currentTotal += parseFloat(value)
        previousTotal += parseFloat(prevValue)
        return {
          assetId,
          month,
          year,
          value,
          isInherited: false,
          inheritedFrom: null,
        }
      })

      const changeAbsolute = currentTotal - previousTotal
      const changePercentage = previousTotal !== 0 ? (changeAbsolute / previousTotal) * 100 : 0

      return NextResponse.json({
        month,
        year,
        totalBalance: currentTotal.toString(),
        totalBalanceCurrency: 'ILS',
        changeFromPrevious: {
          absolute: changeAbsolute.toString(),
          percentage: changePercentage,
        },
        values,
      })
    }

    // Get all assets for the user
    const assetClasses = await prisma.assetClass.findMany({
      where: { userId: authSession.user.id },
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

    const assetIds = assetClasses.flatMap((ac) =>
      ac.instruments.flatMap((inst) => inst.providers.flatMap((prov) => prov.assets.map((a) => a.id)))
    )

    // Get values for current month
    const currentValues = await prisma.monthlyValue.findMany({
      where: {
        userId: authSession.user.id,
        month,
        year,
        assetId: { in: assetIds },
      },
    })

    // Get most recent values before current month for inheritance
    const previousValues = await prisma.monthlyValue.findMany({
      where: {
        userId: authSession.user.id,
        assetId: { in: assetIds },
        OR: [{ year: { lt: year } }, { year, month: { lt: month } }],
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    // Build value map with inheritance
    const valueMap = new Map<string, { value: string; isInherited: boolean; inheritedFrom: { month: number; year: number } | null }>()

    // First, add explicit values
    for (const v of currentValues) {
      valueMap.set(v.assetId, {
        value: v.value.toString(),
        isInherited: false,
        inheritedFrom: null,
      })
    }

    // Then, add inherited values for assets without explicit values
    for (const assetId of assetIds) {
      if (!valueMap.has(assetId)) {
        // Find most recent value for this asset
        const prev = previousValues.find((v) => v.assetId === assetId)
        if (prev) {
          valueMap.set(assetId, {
            value: prev.value.toString(),
            isInherited: true,
            inheritedFrom: { month: prev.month, year: prev.year },
          })
        } else {
          valueMap.set(assetId, {
            value: '0',
            isInherited: false,
            inheritedFrom: null,
          })
        }
      }
    }

    // Get previous month values for change calculation
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    const prevMonthValues = await prisma.monthlyValue.findMany({
      where: {
        userId: authSession.user.id,
        month: prevMonth,
        year: prevYear,
        assetId: { in: assetIds },
      },
    })

    // Calculate totals (simplified - in real app would use exchange rates)
    let currentTotal = 0
    let previousTotal = 0

    for (const assetId of assetIds) {
      const current = valueMap.get(assetId)
      if (current) {
        currentTotal += parseFloat(current.value)
      }

      const prev = prevMonthValues.find((v) => v.assetId === assetId)
      if (prev) {
        previousTotal += parseFloat(prev.value.toString())
      }
    }

    const changeAbsolute = currentTotal - previousTotal
    const changePercentage = previousTotal !== 0 ? (changeAbsolute / previousTotal) * 100 : 0

    // Convert valueMap to values array
    const values = Array.from(valueMap.entries()).map(([assetId, data]) => ({
      assetId,
      month,
      year,
      ...data,
    }))

    return NextResponse.json({
      month,
      year,
      totalBalance: currentTotal.toString(),
      totalBalanceCurrency: authSession.user.defaultCurrency || 'ILS',
      changeFromPrevious: {
        absolute: changeAbsolute.toString(),
        percentage: changePercentage,
      },
      values,
    })
  } catch (error) {
    console.error('Error fetching values:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/values - Set a value
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
    const { assetId, month, year, value } = body

    if (!assetId || !month || !year || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (month < 1 || month > 12 || year < 2000) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 })
    }

    // Verify asset ownership
    const asset = await prisma.asset.findFirst({
      where: { id: assetId },
      include: { provider: { include: { instrument: { include: { assetClass: true } } } } },
    })

    if (!asset || asset.provider.instrument.assetClass.userId !== authSession.user.id) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Upsert value
    const monthlyValue = await prisma.monthlyValue.upsert({
      where: {
        assetId_month_year: { assetId, month, year },
      },
      update: {
        value: parseFloat(value),
      },
      create: {
        assetId,
        userId: authSession.user.id,
        month,
        year,
        value: parseFloat(value),
      },
    })

    return NextResponse.json({
      id: monthlyValue.id,
      assetId: monthlyValue.assetId,
      month: monthlyValue.month,
      year: monthlyValue.year,
      value: monthlyValue.value.toString(),
    })
  } catch (error) {
    console.error('Error setting value:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
