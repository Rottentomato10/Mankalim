'use client'

import { useState, useEffect, useCallback } from 'react'

interface ValueData {
  assetId: string
  month: number
  year: number
  value: string
  isInherited: boolean
  inheritedFrom: { month: number; year: number } | null
}

interface MonthlyValuesResponse {
  month: number
  year: number
  totalBalance: string
  totalBalanceCurrency: string
  changeFromPrevious: {
    absolute: string
    percentage: number
  }
  values: ValueData[]
}

interface ExchangeRatesResponse {
  baseCurrency: string
  rates: Record<string, number>
  fetchedAt: string
  isStale: boolean
}

interface UseMonthlyValuesReturn {
  data: MonthlyValuesResponse | null
  exchangeRates: ExchangeRatesResponse | null
  isLoading: boolean
  error: string | null
  setValue: (assetId: string, value: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useMonthlyValues(month: number, year: number): UseMonthlyValuesReturn {
  const [data, setData] = useState<MonthlyValuesResponse | null>(null)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRatesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!month || !year) return

    try {
      setError(null)
      setIsLoading(true)

      const [valuesRes, ratesRes] = await Promise.all([
        fetch(`/api/values?month=${month}&year=${year}`),
        fetch('/api/exchange-rates'),
      ])

      if (!valuesRes.ok) throw new Error('Failed to fetch values')
      if (!ratesRes.ok) throw new Error('Failed to fetch exchange rates')

      const valuesData = await valuesRes.json()
      const ratesData = await ratesRes.json()

      setData(valuesData)
      setExchangeRates(ratesData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const setValue = async (assetId: string, value: string) => {
    try {
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          values: prev.values.map((v) =>
            v.assetId === assetId ? { ...v, value, isInherited: false, inheritedFrom: null } : v
          ),
        }
      })

      const response = await fetch('/api/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, month, year, value }),
      })

      if (!response.ok) {
        throw new Error('Failed to set value')
      }

      // Refetch to get updated totals
      await fetchData()
    } catch (e) {
      // Revert on error
      await fetchData()
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  return {
    data,
    exchangeRates,
    isLoading,
    error,
    setValue,
    refetch: fetchData,
  }
}

export default useMonthlyValues
