import type { Asset, MonthlyValue } from '@/types'

interface AssetWithValue extends Asset {
  currentValue?: string
  previousValue?: string
}

interface CalculationResult {
  totalBalance: number
  changeAbsolute: number
  changePercentage: number
}

/**
 * Calculates total balance from assets (ILS only)
 */
export function calculateTotalBalance(assets: AssetWithValue[]): number {
  return assets.reduce((total, asset) => {
    const value = parseFloat(asset.currentValue || '0')
    return total + value
  }, 0)
}

/**
 * Calculates month-over-month change for a set of assets
 */
export function calculateMonthlyChange(
  currentValues: AssetWithValue[],
  previousValues: Map<string, string>
): CalculationResult {
  let currentTotal = 0
  let previousTotal = 0

  for (const asset of currentValues) {
    const currentValue = parseFloat(asset.currentValue || '0')
    const previousValue = parseFloat(previousValues.get(asset.id) || '0')

    currentTotal += currentValue
    previousTotal += previousValue
  }

  const changeAbsolute = currentTotal - previousTotal
  const changePercentage = previousTotal !== 0 ? (changeAbsolute / previousTotal) * 100 : 0

  return {
    totalBalance: currentTotal,
    changeAbsolute,
    changePercentage,
  }
}

/**
 * Calculates year-over-year change
 */
export function calculateYearlyChange(
  currentValues: AssetWithValue[],
  yearAgoValues: Map<string, string>
): CalculationResult {
  return calculateMonthlyChange(currentValues, yearAgoValues)
}

/**
 * Calculates year-to-date (YTD) change from January of current year
 */
export function calculateYTDChange(
  currentValues: AssetWithValue[],
  januaryValues: Map<string, string>
): CalculationResult {
  return calculateMonthlyChange(currentValues, januaryValues)
}

/**
 * Calculates average monthly growth over a period
 */
export function calculateAverageMonthlyGrowth(
  monthlyTotals: { month: number; year: number; total: number }[]
): { absolute: number; percentage: number } {
  if (monthlyTotals.length < 2) {
    return { absolute: 0, percentage: 0 }
  }

  // Sort by date
  const sorted = [...monthlyTotals].sort((a, b) => {
    const dateA = a.year * 12 + a.month
    const dateB = b.year * 12 + b.month
    return dateA - dateB
  })

  let totalAbsoluteChange = 0
  let totalPercentageChange = 0
  let countWithPrevious = 0

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i].total
    const previous = sorted[i - 1].total

    if (previous > 0) {
      totalAbsoluteChange += current - previous
      totalPercentageChange += ((current - previous) / previous) * 100
      countWithPrevious++
    }
  }

  return {
    absolute: countWithPrevious > 0 ? totalAbsoluteChange / countWithPrevious : 0,
    percentage: countWithPrevious > 0 ? totalPercentageChange / countWithPrevious : 0,
  }
}

/**
 * Gets the most recent value for an asset, with inheritance from previous months
 */
export function getValueWithInheritance(
  values: MonthlyValue[],
  assetId: string,
  targetMonth: number,
  targetYear: number
): { value: string; isInherited: boolean; inheritedFrom: { month: number; year: number } | null } {
  // Filter to this asset and sort by date descending
  const assetValues = values
    .filter((v) => v.assetId === assetId)
    .sort((a, b) => {
      const dateA = a.year * 12 + a.month
      const dateB = b.year * 12 + b.month
      return dateB - dateA
    })

  // Find exact match
  const exactMatch = assetValues.find((v) => v.month === targetMonth && v.year === targetYear)

  if (exactMatch) {
    return {
      value: exactMatch.value,
      isInherited: false,
      inheritedFrom: null,
    }
  }

  // Find most recent value before target date
  const targetDateNum = targetYear * 12 + targetMonth
  const previousValue = assetValues.find((v) => {
    const valueDateNum = v.year * 12 + v.month
    return valueDateNum < targetDateNum
  })

  if (previousValue) {
    return {
      value: previousValue.value,
      isInherited: true,
      inheritedFrom: { month: previousValue.month, year: previousValue.year },
    }
  }

  // No value found, return 0
  return {
    value: '0',
    isInherited: false,
    inheritedFrom: null,
  }
}

/**
 * Finds the largest asset by value
 */
export function findLargestAsset(
  assets: AssetWithValue[]
): { id: string; name: string; value: number } | null {
  if (assets.length === 0) return null

  let largest: { id: string; name: string; value: number } | null = null

  for (const asset of assets) {
    const value = parseFloat(asset.currentValue || '0')

    if (!largest || value > largest.value) {
      largest = { id: asset.id, name: asset.name, value }
    }
  }

  return largest
}

/**
 * Finds the asset with highest growth percentage
 */
export function findHighestGrowthAsset(
  assets: AssetWithValue[],
  previousValues: Map<string, string>
): { id: string; name: string; growthPercentage: number } | null {
  if (assets.length === 0) return null

  let highest: { id: string; name: string; growthPercentage: number } | null = null

  for (const asset of assets) {
    const currentValue = parseFloat(asset.currentValue || '0')
    const previousValue = parseFloat(previousValues.get(asset.id) || '0')

    if (previousValue > 0) {
      const growthPercentage = ((currentValue - previousValue) / previousValue) * 100

      if (!highest || growthPercentage > highest.growthPercentage) {
        highest = { id: asset.id, name: asset.name, growthPercentage }
      }
    }
  }

  return highest
}

/**
 * Calculates distribution by asset class, instrument, or provider
 */
export function calculateDistribution(
  items: { label: string; value: number }[],
  colors: string[]
): { label: string; value: number; percentage: number; color: string }[] {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return items.map((item, index) => ({
    label: item.label,
    value: item.value,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
    color: colors[index % colors.length],
  }))
}

/**
 * Default chart colors
 */
export const CHART_COLORS = [
  '#38bdf8', // sky-400
  '#4ade80', // green-400
  '#fb7185', // rose-400
  '#facc15', // yellow-400
  '#a78bfa', // violet-400
  '#f97316', // orange-500
  '#22d3ee', // cyan-400
  '#e879f9', // fuchsia-400
]

/**
 * Formats a number with K/M/B suffixes for large numbers
 */
export function formatCompactNumber(num: number, locale: string = 'he-IL'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num)
}

/**
 * Formats a percentage with proper sign
 */
export function formatPercentage(percentage: number, showSign: boolean = true): string {
  const sign = showSign && percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(2)}%`
}

/**
 * Gets the previous month and year
 */
export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 }
  }
  return { month: month - 1, year }
}

/**
 * Gets the same month from the previous year
 */
export function getSameMonthLastYear(month: number, year: number): { month: number; year: number } {
  return { month, year: year - 1 }
}

/**
 * Formats month/year for display in Hebrew
 */
export function formatMonthYear(month: number, year: number, locale: string = 'he-IL'): string {
  const date = new Date(year, month - 1)
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date)
}
