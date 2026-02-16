import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/demo-auth'
import { Decimal } from '@prisma/client/runtime/library'

const ADMIN_EMAIL = 'spread.a.wing@gmail.com'

// GET /api/admin/stats
export async function GET() {
  try {
    const authSession = await getAuthSession()

    if (!authSession?.user?.email || authSession.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    // Run all queries in parallel for performance
    const [
      totalUsers,
      usersOnline,
      usersToday,
      usersThisWeek,
      usersThisMonth,
      transactionsToday,
      transactionsThisMonth,
      assetsToday,
      assetsThisMonth,
      totalTransactions,
      totalAssets,
      totalMonthlyValues,
      users,
      registrationsByDay,
    ] = await Promise.all([
      // Total registered users
      prisma.user.count({
        where: { deletedAt: null },
      }),

      // Users online (active in last 5 minutes)
      prisma.user.count({
        where: {
          deletedAt: null,
          lastActiveAt: { gte: fiveMinutesAgo },
        },
      }),

      // Users registered today
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: todayStart },
        },
      }),

      // Users registered this week
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: weekStart },
        },
      }),

      // Users registered this month
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: monthStart },
        },
      }),

      // Transactions today
      prisma.transaction.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),

      // Transactions this month
      prisma.transaction.count({
        where: {
          createdAt: { gte: monthStart },
        },
      }),

      // Assets created today
      prisma.asset.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),

      // Assets created this month
      prisma.asset.count({
        where: {
          createdAt: { gte: monthStart },
        },
      }),

      // Total transactions
      prisma.transaction.count(),

      // Total assets
      prisma.asset.count(),

      // Total monthly values (value updates)
      prisma.monthlyValue.count(),

      // All users with stats
      prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
          lastActiveAt: true,
          _count: {
            select: {
              transactions: true,
              assetClasses: true,
              monthlyValues: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Registrations by day (last 30 days)
      prisma.$queryRaw`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users
        WHERE created_at >= ${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      ` as Promise<{ date: Date; count: bigint }[]>,
    ])

    // Calculate total managed value - get sum of all latest values per asset
    const totalManagedValue = await prisma.monthlyValue.aggregate({
      _sum: {
        value: true,
      },
    })

    // Get latest values per user for more accurate total
    const latestValuesByUser = await prisma.$queryRaw`
      SELECT user_id, SUM(value) as total
      FROM (
        SELECT DISTINCT ON (asset_id) user_id, value
        FROM monthly_values
        ORDER BY asset_id, year DESC, month DESC
      ) latest
      GROUP BY user_id
    ` as { user_id: string; total: number }[]

    const actualTotalManaged = latestValuesByUser.reduce((sum, u) => sum + Number(u.total || 0), 0)

    // ============================================
    // AGGREGATE STATISTICS
    // ============================================

    // Get average income and expenses per user (monthly)
    const incomeStats = await prisma.transaction.aggregate({
      where: { type: 'INCOME' },
      _sum: { amount: true },
      _count: true,
    })

    const expenseStats = await prisma.transaction.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true },
      _count: true,
    })

    // Get users who have transactions
    const usersWithTransactions = await prisma.transaction.groupBy({
      by: ['userId'],
      _count: true,
    })

    const activeUsersCount = usersWithTransactions.length || 1

    // Average income/expense per active user
    const avgIncomePerUser = Number(incomeStats._sum.amount || 0) / activeUsersCount
    const avgExpensePerUser = Number(expenseStats._sum.amount || 0) / activeUsersCount

    // Average net worth (from assets) per user
    const usersWithAssets = latestValuesByUser.length || 1
    const avgNetWorth = actualTotalManaged / usersWithAssets

    // Get expense breakdown by category (top categories)
    const expensesByCategory = await prisma.$queryRaw`
      SELECT
        c.name as category_name,
        SUM(t.amount) as total,
        COUNT(t.id) as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'EXPENSE'
      GROUP BY c.name
      ORDER BY total DESC
      LIMIT 10
    ` as { category_name: string | null; total: Decimal; count: bigint }[]

    // Calculate average per category
    const categoryAverages = expensesByCategory.map(cat => ({
      name: cat.category_name || 'ללא קטגוריה',
      total: Number(cat.total),
      count: Number(cat.count),
      avgPerUser: Number(cat.total) / activeUsersCount,
    }))

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const monthlyTrends = await prisma.$queryRaw`
      SELECT
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(MONTH FROM date) as month,
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE date >= ${sixMonthsAgo}
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), type
      ORDER BY year, month
    ` as { year: number; month: number; type: string; total: Decimal; count: bigint }[]

    return NextResponse.json({
      users: {
        total: totalUsers,
        online: usersOnline,
        today: usersToday,
        thisWeek: usersThisWeek,
        thisMonth: usersThisMonth,
      },
      activity: {
        transactionsToday,
        transactionsThisMonth,
        assetsToday,
        assetsThisMonth,
        totalTransactions,
        totalAssets,
        totalMonthlyValues,
      },
      financials: {
        totalManagedValue: actualTotalManaged.toString(),
      },
      userList: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
        transactions: u._count.transactions,
        assetClasses: u._count.assetClasses,
        monthlyValues: u._count.monthlyValues,
      })),
      registrationsByDay: registrationsByDay.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      // Aggregate statistics
      aggregates: {
        avgIncomePerUser: Math.round(avgIncomePerUser),
        avgExpensePerUser: Math.round(avgExpensePerUser),
        avgNetWorth: Math.round(avgNetWorth),
        totalIncome: Number(incomeStats._sum.amount || 0),
        totalExpenses: Number(expenseStats._sum.amount || 0),
        activeUsersCount,
        usersWithAssets,
        categoryAverages,
        monthlyTrends: monthlyTrends.map(t => ({
          year: Number(t.year),
          month: Number(t.month),
          type: t.type,
          total: Number(t.total),
          count: Number(t.count),
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
