import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/demo-auth'
import { DEMO_ASSET_CLASSES, DEMO_VALUES, DEMO_PREVIOUS_VALUES } from '@/lib/demo-data'

const MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']
const COLORS = ['#38bdf8', '#4ade80', '#fb7185', '#f59e0b', '#a78bfa', '#f472b6', '#34d399']

interface MonthlyTotal {
  month: number
  year: number
  label: string
  total: number
  byClass: Record<string, number>
}

interface Distribution {
  name: string
  value: number
  percent: number
  color: string
}

interface AssetPerformance {
  assetId: string
  assetName: string
  current: number
  previous: number
  change: number
  changePercent: number
}

// GET /api/dashboard/analytics?months=12
export async function GET(request: Request) {
  try {
    const authSession = await getAuthSession()

    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '12')
    const timeRange = Math.min(Math.max(months, 1), 24) // Limit to 1-24 months

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Build list of months to analyze
    const monthsToAnalyze: { month: number; year: number; key: string }[] = []
    for (let i = timeRange - 1; i >= 0; i--) {
      let month = currentMonth - i
      let year = currentYear

      while (month <= 0) {
        month += 12
        year--
      }

      monthsToAnalyze.push({ month, year, key: `${month}-${year}` })
    }

    // Handle demo mode
    if (authSession.isDemo) {
      return handleDemoMode(currentMonth, currentYear, monthsToAnalyze)
    }

    // Fetch asset classes with all nested assets in ONE query
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

    // Build asset info map
    const allAssets: { id: string; name: string; isLiquid: boolean; currency: string; assetClassName: string }[] = []
    assetClasses.forEach((ac) => {
      ac.instruments?.forEach((inst) => {
        inst.providers?.forEach((prov) => {
          prov.assets?.forEach((asset) => {
            allAssets.push({
              id: asset.id,
              name: asset.name,
              isLiquid: asset.isLiquid,
              currency: asset.currency || 'ILS',
              assetClassName: ac.name,
            })
          })
        })
      })
    })

    const assetIds = allAssets.map(a => a.id)

    if (assetIds.length === 0) {
      return NextResponse.json(emptyAnalytics(monthsToAnalyze))
    }

    // Calculate date range for single query
    const oldestMonth = monthsToAnalyze[0]
    const newestMonth = monthsToAnalyze[monthsToAnalyze.length - 1]

    // Fetch ALL monthly values in ONE query
    const allValues = await prisma.monthlyValue.findMany({
      where: {
        userId: authSession.user.id,
        assetId: { in: assetIds },
        OR: [
          // All months in range
          {
            year: { gte: oldestMonth.year, lte: newestMonth.year },
          },
        ],
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    // Organize values by month-year key
    const valuesByMonth: Record<string, Record<string, number>> = {}
    allValues.forEach(v => {
      const key = `${v.month}-${v.year}`
      if (!valuesByMonth[key]) valuesByMonth[key] = {}
      valuesByMonth[key][v.assetId] = parseFloat(v.value.toString())
    })

    // Handle value inheritance - for each month, fill in missing assets from previous months
    const processedValues: Record<string, Record<string, number>> = {}
    const lastKnownValue: Record<string, number> = {}

    for (const { key, month, year } of monthsToAnalyze) {
      const monthValues = valuesByMonth[key] || {}
      processedValues[key] = {}

      for (const asset of allAssets) {
        if (monthValues[asset.id] !== undefined) {
          processedValues[key][asset.id] = monthValues[asset.id]
          lastKnownValue[asset.id] = monthValues[asset.id]
        } else if (lastKnownValue[asset.id] !== undefined) {
          processedValues[key][asset.id] = lastKnownValue[asset.id]
        } else {
          processedValues[key][asset.id] = 0
        }
      }
    }

    // Calculate monthly totals
    const monthlyTotals: MonthlyTotal[] = monthsToAnalyze.map(({ month, year, key }) => {
      const values = processedValues[key] || {}
      let total = 0
      const byClass: Record<string, number> = {}

      for (const asset of allAssets) {
        const value = values[asset.id] || 0
        total += value
        byClass[asset.assetClassName] = (byClass[asset.assetClassName] || 0) + value
      }

      return {
        month,
        year,
        label: `${MONTHS[month - 1]} ${year.toString().slice(-2)}`,
        total,
        byClass,
      }
    })

    // Current month data
    const currentKey = `${currentMonth}-${currentYear}`
    const currentValues = processedValues[currentKey] || {}
    const currentTotal = Object.values(currentValues).reduce((sum, v) => sum + v, 0)

    // Previous month data
    let prevMonth = currentMonth - 1
    let prevYear = currentYear
    if (prevMonth === 0) { prevMonth = 12; prevYear-- }
    const prevKey = `${prevMonth}-${prevYear}`
    const prevValues = processedValues[prevKey] || {}
    const prevTotal = Object.values(prevValues).reduce((sum, v) => sum + v, 0)
    const monthlyChange = prevTotal > 0 ? currentTotal - prevTotal : 0
    const monthlyChangePercent = prevTotal > 0 ? (monthlyChange / prevTotal) * 100 : 0

    // Year start data
    const yearStartKey = `1-${currentYear}`
    const yearStartValues = processedValues[yearStartKey] || {}
    const yearStartTotal = Object.values(yearStartValues).reduce((sum, v) => sum + v, 0)
    const ytdChange = yearStartTotal > 0 ? currentTotal - yearStartTotal : 0
    const ytdChangePercent = yearStartTotal > 0 ? (ytdChange / yearStartTotal) * 100 : 0

    // Last year same month
    const lastYearKey = `${currentMonth}-${currentYear - 1}`
    const lastYearValues = processedValues[lastYearKey] || {}
    const lastYearTotal = Object.values(lastYearValues).reduce((sum, v) => sum + v, 0)
    const yearlyChange = lastYearTotal > 0 ? currentTotal - lastYearTotal : 0
    const yearlyChangePercent = lastYearTotal > 0 ? (yearlyChange / lastYearTotal) * 100 : 0

    // Average monthly growth
    const growthRates: number[] = []
    for (let i = 1; i < monthlyTotals.length; i++) {
      const prev = monthlyTotals[i - 1].total
      const curr = monthlyTotals[i].total
      if (prev > 0) {
        growthRates.push(((curr - prev) / prev) * 100)
      }
    }
    const avgMonthlyGrowth = growthRates.length > 0
      ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
      : 0

    // Distribution by asset class
    const classTotals: Record<string, number> = {}
    allAssets.forEach(asset => {
      const value = currentValues[asset.id] || 0
      if (value > 0) {
        classTotals[asset.assetClassName] = (classTotals[asset.assetClassName] || 0) + value
      }
    })
    const classDistribution: Distribution[] = Object.entries(classTotals).map(([name, value], i) => ({
      name,
      value,
      percent: currentTotal > 0 ? (value / currentTotal) * 100 : 0,
      color: COLORS[i % COLORS.length],
    }))

    // Distribution by currency
    const currencyTotals: Record<string, number> = {}
    allAssets.forEach(asset => {
      const value = currentValues[asset.id] || 0
      if (value > 0) {
        currencyTotals[asset.currency] = (currencyTotals[asset.currency] || 0) + value
      }
    })
    const currencyDistribution: Distribution[] = Object.entries(currencyTotals).map(([name, value], i) => ({
      name,
      value,
      percent: currentTotal > 0 ? (value / currentTotal) * 100 : 0,
      color: COLORS[i % COLORS.length],
    }))

    // Distribution by liquidity
    let liquidTotal = 0
    let illiquidTotal = 0
    allAssets.forEach(asset => {
      const value = currentValues[asset.id] || 0
      if (asset.isLiquid) {
        liquidTotal += value
      } else {
        illiquidTotal += value
      }
    })
    const liquidityDistribution: Distribution[] = [
      { name: 'נזיל', value: liquidTotal, percent: currentTotal > 0 ? (liquidTotal / currentTotal) * 100 : 0, color: '#4ade80' },
      { name: 'לא נזיל', value: illiquidTotal, percent: currentTotal > 0 ? (illiquidTotal / currentTotal) * 100 : 0, color: '#fb7185' },
    ].filter(d => d.value > 0)

    // Asset performance
    const assetPerformance: AssetPerformance[] = allAssets.map(asset => {
      const current = currentValues[asset.id] || 0
      const prev = prevValues[asset.id] || 0
      const change = current - prev
      const changePercent = prev > 0 ? (change / prev) * 100 : 0
      return {
        assetId: asset.id,
        assetName: asset.name,
        current,
        previous: prev,
        change,
        changePercent,
      }
    }).filter(p => p.current > 0 || p.previous > 0)

    const topAsset = [...assetPerformance].sort((a, b) => b.current - a.current)[0] || null
    const bestGrowth = [...assetPerformance].filter(p => p.previous > 0).sort((a, b) => b.changePercent - a.changePercent)[0] || null
    const worstGrowth = [...assetPerformance].filter(p => p.previous > 0).sort((a, b) => a.changePercent - b.changePercent)[0] || null

    // Monthly contributions
    const monthlyContributions = monthlyTotals.slice(1).map((mt, i) => ({
      label: mt.label,
      contribution: mt.total - monthlyTotals[i].total,
    }))

    // Fill rate
    const totalAssets = allAssets.length
    const assetsWithValues = Object.keys(currentValues).filter(k => currentValues[k] > 0).length
    const fillRate = totalAssets > 0 ? (assetsWithValues / totalAssets) * 100 : 0

    return NextResponse.json({
      currentTotal,
      monthlyChange,
      monthlyChangePercent,
      ytdChange,
      ytdChangePercent,
      yearlyChange,
      yearlyChangePercent,
      avgMonthlyGrowth,
      liquidTotal,
      illiquidTotal,
      totalAssets,
      assetsWithValues,
      fillRate,
      monthlyTotals,
      classDistribution,
      currencyDistribution,
      liquidityDistribution,
      topAsset,
      bestGrowth,
      worstGrowth,
      monthlyContributions,
    })
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function handleDemoMode(
  currentMonth: number,
  currentYear: number,
  monthsToAnalyze: { month: number; year: number; key: string }[]
) {
  // Generate demo analytics data
  const currentTotal = Object.values(DEMO_VALUES).reduce((sum, v) => sum + parseFloat(v), 0)
  const previousTotal = Object.values(DEMO_PREVIOUS_VALUES).reduce((sum, v) => sum + parseFloat(v), 0)

  const monthlyChange = currentTotal - previousTotal
  const monthlyChangePercent = previousTotal > 0 ? (monthlyChange / previousTotal) * 100 : 0

  // Generate demo monthly totals with slight variation
  const monthlyTotals: MonthlyTotal[] = monthsToAnalyze.map(({ month, year, key }, i) => {
    const factor = 0.85 + (i / monthsToAnalyze.length) * 0.15
    const total = currentTotal * factor
    return {
      month,
      year,
      label: `${MONTHS[month - 1]} ${year.toString().slice(-2)}`,
      total,
      byClass: { 'מזומן': total * 0.3, 'השקעות': total * 0.5, 'נדל"ן': total * 0.2 },
    }
  })

  const monthlyContributions = monthlyTotals.slice(1).map((mt, i) => ({
    label: mt.label,
    contribution: mt.total - monthlyTotals[i].total,
  }))

  return NextResponse.json({
    currentTotal,
    monthlyChange,
    monthlyChangePercent,
    ytdChange: currentTotal * 0.15,
    ytdChangePercent: 15,
    yearlyChange: currentTotal * 0.25,
    yearlyChangePercent: 25,
    avgMonthlyGrowth: 2.5,
    liquidTotal: currentTotal * 0.6,
    illiquidTotal: currentTotal * 0.4,
    totalAssets: Object.keys(DEMO_VALUES).length,
    assetsWithValues: Object.keys(DEMO_VALUES).length,
    fillRate: 100,
    monthlyTotals,
    classDistribution: [
      { name: 'מזומן', value: currentTotal * 0.3, percent: 30, color: '#38bdf8' },
      { name: 'השקעות', value: currentTotal * 0.5, percent: 50, color: '#4ade80' },
      { name: 'נדל"ן', value: currentTotal * 0.2, percent: 20, color: '#fb7185' },
    ],
    currencyDistribution: [
      { name: 'ILS', value: currentTotal * 0.7, percent: 70, color: '#38bdf8' },
      { name: 'USD', value: currentTotal * 0.3, percent: 30, color: '#4ade80' },
    ],
    liquidityDistribution: [
      { name: 'נזיל', value: currentTotal * 0.6, percent: 60, color: '#4ade80' },
      { name: 'לא נזיל', value: currentTotal * 0.4, percent: 40, color: '#fb7185' },
    ],
    topAsset: { assetId: 'demo-1', assetName: 'קרן השתלמות', current: currentTotal * 0.3, previous: previousTotal * 0.3, change: (currentTotal - previousTotal) * 0.3, changePercent: 5 },
    bestGrowth: { assetId: 'demo-2', assetName: 'מניות טכנולוגיה', current: currentTotal * 0.2, previous: previousTotal * 0.15, change: currentTotal * 0.05, changePercent: 12 },
    worstGrowth: { assetId: 'demo-3', assetName: 'אג"ח ממשלתי', current: currentTotal * 0.1, previous: previousTotal * 0.12, change: -currentTotal * 0.02, changePercent: -2 },
    monthlyContributions,
  })
}

function emptyAnalytics(monthsToAnalyze: { month: number; year: number; key: string }[]) {
  const monthlyTotals: MonthlyTotal[] = monthsToAnalyze.map(({ month, year }) => ({
    month,
    year,
    label: `${MONTHS[month - 1]} ${year.toString().slice(-2)}`,
    total: 0,
    byClass: {},
  }))

  return {
    currentTotal: 0,
    monthlyChange: 0,
    monthlyChangePercent: 0,
    ytdChange: 0,
    ytdChangePercent: 0,
    yearlyChange: 0,
    yearlyChangePercent: 0,
    avgMonthlyGrowth: 0,
    liquidTotal: 0,
    illiquidTotal: 0,
    totalAssets: 0,
    assetsWithValues: 0,
    fillRate: 0,
    monthlyTotals,
    classDistribution: [],
    currencyDistribution: [],
    liquidityDistribution: [],
    topAsset: null,
    bestGrowth: null,
    worstGrowth: null,
    monthlyContributions: [],
  }
}
