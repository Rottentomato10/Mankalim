/**
 * Client-safe formatting utilities
 */

/**
 * Formats a number as currency
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'ILS',
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
 * Formats a number with locale-specific formatting
 */
export function formatNumber(num: number, locale: string = 'he-IL'): string {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Format a number with the Shekel symbol prefix
 */
export function formatShekel(amount: number): string {
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  const sign = amount < 0 ? '-' : ''
  return `${sign}₪${formatted}`
}

/**
 * Parse a currency string back to a number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[₪\s,]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format a date in Hebrew locale
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Format a date as short format (DD/MM/YYYY)
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * Format month and year in Hebrew
 */
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
  }).format(d)
}

/**
 * Get the first day of a month as ISO string (YYYY-MM-DD)
 */
export function getFirstDayOfMonth(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  return d.toISOString().split('T')[0]
}

/**
 * Get the last day of a month as ISO string (YYYY-MM-DD)
 */
export function getLastDayOfMonth(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return d.toISOString().split('T')[0]
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}
