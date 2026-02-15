import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/demo-auth'

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
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
