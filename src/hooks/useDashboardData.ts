'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

interface MonthlyTotal {
  month: number
  year: number
  label: string
  total: number
  byClass: Record<string, number>
}

interface AssetPerformance {
  assetId: string
  assetName: string
  current: number
  previous: number
  change: number
  changePercent: number
}

interface Distribution {
  name: string
  value: number
  percent: number
  color: string
}

interface DashboardAnalytics {
  currentTotal: number
  monthlyChange: number
  monthlyChangePercent: number
  ytdChange: number
  ytdChangePercent: number
  yearlyChange: number
  yearlyChangePercent: number
  avgMonthlyGrowth: number
  liquidTotal: number
  illiquidTotal: number
  totalAssets: number
  assetsWithValues: number
  fillRate: number
  monthlyTotals: MonthlyTotal[]
  classDistribution: Distribution[]
  currencyDistribution: Distribution[]
  liquidityDistribution: Distribution[]
  topAsset: AssetPerformance | null
  bestGrowth: AssetPerformance | null
  worstGrowth: AssetPerformance | null
  monthlyContributions: { label: string; contribution: number }[]
}

interface DashboardData {
  analytics: DashboardAnalytics | null
  isLoading: boolean
  error: string | null
}

const MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']
const COLORS = ['#38bdf8', '#4ade80', '#fb7185', '#f59e0b', '#a78bfa', '#f472b6', '#34d399']

export function useDashboardData(timeRange: number = 12): DashboardData {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all data needed for dashboard
      const [classesRes, valuesRes] = await Promise.all([
        fetch('/api/assets/classes'),
        fetch('/api/dashboard/analytics?months=' + timeRange),
      ])

      if (!classesRes.ok) throw new Error('Failed to fetch asset classes')

      const assetClasses = await classesRes.json()

      // If dashboard analytics API exists, use it
      if (valuesRes.ok) {
        const analyticsData = await valuesRes.json()
        setAnalytics(analyticsData)
        return
      }

      // Otherwise, calculate analytics client-side
      // Fetch monthly values for the time range
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      // Build list of all assets
      const allAssets: { id: string; name: string; isLiquid: boolean; currency: string; assetClassName: string }[] = []
      assetClasses.forEach((ac: any) => {
        ac.instruments?.forEach((inst: any) => {
          inst.providers?.forEach((prov: any) => {
            prov.assets?.forEach((asset: any) => {
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

      // Fetch values for each month in the range
      const monthlyTotals: MonthlyTotal[] = []
      const allMonthlyValues: Record<string, Record<string, number>> = {} // month-year -> assetId -> value

      for (let i = timeRange - 1; i >= 0; i--) {
        let month = currentMonth - i
        let year = currentYear

        while (month <= 0) {
          month += 12
          year--
        }

        const key = `${month}-${year}`
        const res = await fetch(`/api/values?month=${month}&year=${year}`)

        if (res.ok) {
          const data = await res.json()
          const values: Record<string, number> = {}
          let total = 0
          const byClass: Record<string, number> = {}

          data.values?.forEach((v: any) => {
            const numValue = parseFloat(v.value) || 0
            values[v.assetId] = numValue
            total += numValue

            const asset = allAssets.find(a => a.id === v.assetId)
            if (asset) {
              byClass[asset.assetClassName] = (byClass[asset.assetClassName] || 0) + numValue
            }
          })

          allMonthlyValues[key] = values
          monthlyTotals.push({
            month,
            year,
            label: `${MONTHS[month - 1]} ${year.toString().slice(-2)}`,
            total,
            byClass,
          })
        }
      }

      // Current month data
      const currentKey = `${currentMonth}-${currentYear}`
      const currentValues = allMonthlyValues[currentKey] || {}
      const currentTotal = Object.values(currentValues).reduce((sum, v) => sum + v, 0)

      // Previous month data
      let prevMonth = currentMonth - 1
      let prevYear = currentYear
      if (prevMonth === 0) { prevMonth = 12; prevYear-- }
      const prevKey = `${prevMonth}-${prevYear}`
      const prevValues = allMonthlyValues[prevKey] || {}
      const prevTotal = Object.values(prevValues).reduce((sum, v) => sum + v, 0)
      const monthlyChange = prevTotal > 0 ? currentTotal - prevTotal : 0
      const monthlyChangePercent = prevTotal > 0 ? (monthlyChange / prevTotal) * 100 : 0

      // Year start data
      const yearStartKey = `1-${currentYear}`
      const yearStartValues = allMonthlyValues[yearStartKey] || {}
      const yearStartTotal = Object.values(yearStartValues).reduce((sum, v) => sum + v, 0)
      const ytdChange = yearStartTotal > 0 ? currentTotal - yearStartTotal : 0
      const ytdChangePercent = yearStartTotal > 0 ? (ytdChange / yearStartTotal) * 100 : 0

      // Last year same month
      const lastYearKey = `${currentMonth}-${currentYear - 1}`
      const lastYearValues = allMonthlyValues[lastYearKey] || {}
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

      setAnalytics({
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { analytics, isLoading, error }
}

export default useDashboardData
