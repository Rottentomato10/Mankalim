/**
 * Validate that a value is a positive number greater than zero
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && isFinite(value)
}

/**
 * Validate that a value is within the allowed amount range
 */
export function isValidAmount(value: unknown): value is number {
  return isPositiveNumber(value) && value <= 10000000
}

/**
 * Validate that a date is not in the future
 */
export function isNotFutureDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  return d <= today
}

/**
 * Validate that a string is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Validate that a string is a valid email
 */
export function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

/**
 * Validate transaction type
 */
export function isValidTransactionType(value: unknown): value is 'INCOME' | 'EXPENSE' {
  return value === 'INCOME' || value === 'EXPENSE'
}

/**
 * Validate payment method
 */
export function isValidPaymentMethod(value: unknown): value is 'CASH' | 'CARD' {
  return value === 'CASH' || value === 'CARD'
}

/**
 * Validate that a string is within length limits
 */
export function isWithinLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max
}

/**
 * Sanitize a string for safe display (basic XSS prevention)
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Validate expense data
 */
export function validateExpense(data: {
  amount?: unknown
  categoryId?: unknown
  paymentMethod?: unknown
  date?: unknown
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!isValidAmount(data.amount)) {
    errors.push('הסכום חייב להיות מספר חיובי עד 10,000,000')
  }

  if (!data.categoryId || (typeof data.categoryId === 'string' && !isValidUUID(data.categoryId))) {
    errors.push('יש לבחור קטגוריה')
  }

  if (!isValidPaymentMethod(data.paymentMethod)) {
    errors.push('יש לבחור אמצעי תשלום')
  }

  if (data.date && !isNotFutureDate(data.date as string | Date)) {
    errors.push('לא ניתן לבחור תאריך עתידי')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate income data
 */
export function validateIncome(data: {
  amount?: unknown
  source?: unknown
  date?: unknown
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!isValidAmount(data.amount)) {
    errors.push('הסכום חייב להיות מספר חיובי עד 10,000,000')
  }

  if (!data.source || (typeof data.source === 'string' && data.source.trim().length === 0)) {
    errors.push('יש להזין מקור הכנסה')
  }

  if (data.date && !isNotFutureDate(data.date as string | Date)) {
    errors.push('לא ניתן לבחור תאריך עתידי')
  }

  return { valid: errors.length === 0, errors }
}
