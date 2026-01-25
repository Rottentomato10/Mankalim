import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/demo-auth'

// GET /api/export/all - Export all user data
export async function GET() {
  try {
    const authSession = await getAuthSession()

    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (authSession.isDemo) {
      return NextResponse.json({ values: [], message: 'Demo mode - no data to export' })
    }

    // Get all monthly values for this user
    const values = await prisma.monthlyValue.findMany({
      where: {
        asset: {
          provider: {
            instrument: {
              assetClass: {
                userId: authSession.user.id
              }
            }
          }
        }
      },
      include: {
        asset: {
          select: {
            name: true,
            currency: true,
            provider: {
              select: {
                name: true,
                instrument: {
                  select: {
                    name: true,
                    assetClass: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    return NextResponse.json({ values })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
