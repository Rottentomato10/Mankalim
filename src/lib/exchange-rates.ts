import { prisma } from './prisma'

const SUPPORTED_CURRENCIES = ['ILS', 'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

interface ExchangeRateData {
  rates: Record<string, number>
  fetchedAt: Date
  isStale: boolean
}

const STALE_THRESHOLD_HOURS = 48

/**
 * Fetches current exchange rates from API or returns cached rates
 */
export async function getExchangeRates(baseCurrency: string = 'ILS'): Promise<ExchangeRateData> {
  // Check for cached rates first
  const cachedRates = await prisma.exchangeRate.findFirst({
    where: { baseCurrency },
    orderBy: { fetchedAt: 'desc' },
  })

  const now = new Date()
  const staleThreshold = new Date(now.getTime() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000)

  // Return cached rates if fresh (less than 24 hours old)
  if (cachedRates) {
    const isStale = cachedRates.fetchedAt < staleThreshold
    const rates = cachedRates.rates as Record<string, number>
    return {
      rates,
      fetchedAt: cachedRates.fetchedAt,
      isStale,
    }
  }

  // Fetch new rates
  return await fetchAndCacheRates(baseCurrency)
}

/**
 * Fetches exchange rates from external API and caches them
 */
async function fetchAndCacheRates(baseCurrency: string): Promise<ExchangeRateData> {
  try {
    // Use free exchange rate API
    // If EXCHANGE_RATE_API_KEY is provided, use premium API
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    const apiUrl = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
      : `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`

    const response = await fetch(apiUrl, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`)
    }

    const data = await response.json()
    const rates = apiKey ? data.conversion_rates : data.rates

    // Filter to only supported currencies
    const filteredRates: Record<string, number> = {}
    for (const currency of SUPPORTED_CURRENCIES) {
      if (rates[currency]) {
        filteredRates[currency] = rates[currency]
      }
    }

    // Cache in database
    const exchangeRate = await prisma.exchangeRate.create({
      data: {
        baseCurrency,
        rates: filteredRates,
        fetchedAt: new Date(),
      },
    })

    return {
      rates: filteredRates,
      fetchedAt: exchangeRate.fetchedAt,
      isStale: false,
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)

    // Return fallback rates if API fails
    const fallbackRates = getFallbackRates(baseCurrency)
    return {
      rates: fallbackRates,
      fetchedAt: new Date(),
      isStale: true, // Mark as stale since we couldn't get fresh data
    }
  }
}

/**
 * Returns fallback exchange rates when API is unavailable
 */
function getFallbackRates(baseCurrency: string): Record<string, number> {
  // Approximate rates as of early 2026 (ILS base)
  const ilsBaseRates: Record<string, number> = {
    ILS: 1,
    USD: 0.27,
    EUR: 0.25,
    GBP: 0.21,
    CHF: 0.24,
    JPY: 42.5,
    CAD: 0.37,
    AUD: 0.42,
  }

  if (baseCurrency === 'ILS') {
    return ilsBaseRates
  }

  // Convert from ILS base to requested base
  const ilsToBase = ilsBaseRates[baseCurrency] || 1
  const convertedRates: Record<string, number> = {}

  for (const [currency, ilsRate] of Object.entries(ilsBaseRates)) {
    convertedRates[currency] = ilsRate / ilsToBase
  }

  return convertedRates
}

/**
 * Converts amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const fromRate = rates[fromCurrency] || 1
  const toRate = rates[toCurrency] || 1

  // Convert through base currency
  return (amount / fromRate) * toRate
}

/**
 * Formats a number as currency
 */
export function formatCurrency(
  amount: number | string,
  currency: string,
  locale: string = 'he-IL'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

/**
 * Checks if exchange rates are stale (older than 48 hours)
 */
export function isRatesStale(fetchedAt: Date): boolean {
  const now = new Date()
  const hoursSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60)
  return hoursSinceFetch > STALE_THRESHOLD_HOURS
}

export { SUPPORTED_CURRENCIES }
