import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/demo-auth'

const ADMIN_EMAIL = 'spread.a.wing@gmail.com'

// GET /api/admin/user/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await getAuthSession()

    if (!authSession?.user?.email || authSession.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        lastActiveAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get transactions grouped by month
    const transactions = await prisma.transaction.findMany({
      where: { userId: id },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Group transactions by month
    const monthlyData: Record<string, { income: number; expense: number; transactions: typeof transactions }> = {}

    transactions.forEach(t => {
      const date = new Date(t.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expense: 0, transactions: [] }
      }

      const amount = Number(t.amount)
      if (t.type === 'INCOME') {
        monthlyData[key].income += amount
      } else {
        monthlyData[key].expense += amount
      }
      monthlyData[key].transactions.push(t)
    })

    // Convert to sorted array
    const monthlySummary = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
        transactionCount: data.transactions.length,
      }))
      .sort((a, b) => b.month.localeCompare(a.month))

    // Get assets with latest values
    const assetClasses = await prisma.assetClass.findMany({
      where: { userId: id },
      include: {
        instruments: {
          include: {
            providers: {
              include: {
                assets: {
                  include: {
                    monthlyValues: {
                      orderBy: [{ year: 'desc' }, { month: 'desc' }],
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Flatten assets for display
    const assets: { name: string; class: string; instrument: string; provider: string; value: number; currency: string }[] = []
    let totalAssetValue = 0

    assetClasses.forEach(ac => {
      ac.instruments.forEach(inst => {
        inst.providers.forEach(prov => {
          prov.assets.forEach(asset => {
            const latestValue = asset.monthlyValues[0]?.value || 0
            const value = Number(latestValue)
            totalAssetValue += value
            assets.push({
              name: asset.name,
              class: ac.name,
              instrument: inst.name,
              provider: prov.name,
              value,
              currency: asset.currency,
            })
          })
        })
      })
    })

    // Get categories with totals
    const categories = await prisma.category.findMany({
      where: { userId: id },
      include: {
        _count: { select: { transactions: true } },
      },
    })

    const categoryTotals = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId: id, type: 'EXPENSE' },
      _sum: { amount: true },
    })

    const categoryMap = new Map(categoryTotals.map(c => [c.categoryId, Number(c._sum.amount || 0)]))

    const categorySummary = categories.map(c => ({
      name: c.name,
      total: categoryMap.get(c.id) || 0,
      count: c._count.transactions,
    })).sort((a, b) => b.total - a.total)

    // Summary totals
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return NextResponse.json({
      user,
      summary: {
        totalIncome,
        totalExpense,
        netCashflow: totalIncome - totalExpense,
        totalAssetValue,
        transactionCount: transactions.length,
        assetCount: assets.length,
      },
      monthlySummary,
      assets,
      categorySummary,
    })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
