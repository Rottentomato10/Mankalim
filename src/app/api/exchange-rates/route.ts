import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getExchangeRates } from '@/lib/exchange-rates'

// GET /api/exchange-rates?base=ILS
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const baseCurrency = searchParams.get('base') || session.user.defaultCurrency || 'ILS'

    const rates = await getExchangeRates(baseCurrency)

    return NextResponse.json({
      baseCurrency,
      rates: rates.rates,
      fetchedAt: rates.fetchedAt,
      isStale: rates.isStale,
    })
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
