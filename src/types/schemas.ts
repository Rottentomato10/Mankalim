import { z } from 'zod'

// Transaction type enum
export const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE'])
export const paymentMethodSchema = z.enum(['CASH', 'CARD'])

// Create transaction schema
export const createTransactionSchema = z
  .object({
    type: transactionTypeSchema,
    amount: z.number().positive('הסכום חייב להיות גדול מ-0').max(10000000, 'הסכום מקסימלי הוא 10,000,000'),
    date: z.string(), // Allow any valid date string
    categoryId: z.string().min(1).optional(), // Accept any string ID
    paymentMethod: paymentMethodSchema.optional(),
    source: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'EXPENSE') {
        return data.categoryId !== undefined && data.paymentMethod !== undefined
      }
      return true
    },
    { message: 'הוצאה דורשת קטגוריה ואמצעי תשלום' }
  )
  .refine(
    (data) => {
      if (data.type === 'INCOME') {
        return data.source !== undefined && data.source.length > 0
      }
      return true
    },
    { message: 'הכנסה דורשת מקור' }
  )

// Update transaction schema
export const updateTransactionSchema = z.object({
  amount: z.number().positive().max(10000000).optional(),
  date: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  paymentMethod: paymentMethodSchema.optional(),
  source: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
})

// Category schemas
export const updateCategorySchema = z.object({
  name: z.string().min(1, 'שם הקטגוריה נדרש').max(50, 'שם הקטגוריה ארוך מדי').optional(),
  displayOrder: z.number().int().min(1).max(8).optional(),
})

// Query parameter schemas
export const transactionQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
  month: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const dashboardQuerySchema = z.object({
  month: z.string().optional(),
})

export const monthlyTrendsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
})

export const exportQuerySchema = z
  .object({
    month: z.string().optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  })
  .refine(
    (data) => data.month !== undefined || data.year !== undefined,
    'יש לציין חודש או שנה'
  )
  .refine(
    (data) => !(data.month !== undefined && data.year !== undefined),
    'לא ניתן לציין גם חודש וגם שנה'
  )

// Sync operation schema
export const syncOperationSchema = z.object({
  id: z.string().min(1),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  entityType: z.enum(['transaction', 'category']),
  entityId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).nullable(),
  clientTimestamp: z.string(),
})

export const syncRequestSchema = z.object({
  operations: z.array(syncOperationSchema),
})

// Type exports
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type TransactionQuery = z.infer<typeof transactionQuerySchema>
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>
export type MonthlyTrendsQuery = z.infer<typeof monthlyTrendsQuerySchema>
export type ExportQuery = z.infer<typeof exportQuerySchema>
export type SyncRequest = z.infer<typeof syncRequestSchema>
