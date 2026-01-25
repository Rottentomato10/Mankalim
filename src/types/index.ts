// ============================================
// User types
// ============================================

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  defaultCurrency: string
  dashboardLayout: DashboardLayout | null
  notifyEnabled: boolean
  notifyDay: number
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  defaultCurrency: string
  notifyEnabled: boolean
  notifyDay: number
  deletionPending: boolean
  deletionDate: Date | null
}

// ============================================
// Asset hierarchy types (Balance tracking)
// ============================================

export interface AssetClass {
  id: string
  userId: string
  name: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
  instruments?: Instrument[]
}

export interface Instrument {
  id: string
  assetClassId: string
  name: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
  providers?: Provider[]
}

export interface Provider {
  id: string
  instrumentId: string
  name: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
  assets?: Asset[]
}

export interface Asset {
  id: string
  providerId: string
  name: string
  isLiquid: boolean
  currency: string
  notes: string | null
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Monthly value types (Balance tracking)
// ============================================

export interface MonthlyValue {
  id: string
  assetId: string
  userId: string
  month: number
  year: number
  value: string // Decimal as string for precision
  isInherited?: boolean
  inheritedFrom?: { month: number; year: number } | null
  createdAt: Date
  updatedAt: Date
}

export interface MonthlyValuesResponse {
  month: number
  year: number
  totalBalance: string
  totalBalanceCurrency: string
  changeFromPrevious: {
    absolute: string
    percentage: number
  }
  values: MonthlyValue[]
}

// ============================================
// Transaction types (Cashflow tracking)
// ============================================

export type TransactionType = 'INCOME' | 'EXPENSE'
export type PaymentMethod = 'CASH' | 'CARD'

export interface Transaction {
  id: string
  userId: string
  categoryId: string | null
  type: TransactionType
  amount: number
  date: Date
  paymentMethod: PaymentMethod | null
  source: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  syncedAt: Date | null
  // Denormalized for display
  category?: Category
  categoryName?: string
}

export interface Category {
  id: string
  userId: string
  name: string
  displayOrder: number
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Cashflow Dashboard types
// ============================================

export interface CashflowSummary {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  incomePercentage: number
}

export interface CategoryBreakdown {
  categoryId: string
  categoryName: string
  total: number
  percentage: number
}

export interface MonthlyTrend {
  month: string
  income: number
  expenses: number
}

// ============================================
// Exchange rate types
// ============================================

export interface ExchangeRates {
  baseCurrency: string
  rates: Record<string, number>
  fetchedAt: Date
  isStale: boolean
}

// ============================================
// Balance Dashboard types
// ============================================

export interface BalanceDashboardSummary {
  totalBalance: string
  currency: string
  monthlyGrowth: {
    absolute: string
    percentage: number
  }
  yearlyGrowth: {
    absolute: string
    percentage: number
  }
  ytdGrowth: {
    absolute: string
    percentage: number
  }
  avgMonthlyGrowth: {
    absolute: string
    percentage: number
  }
  largestAsset: {
    id: string
    name: string
    value: string
  } | null
  highestGrowthAsset: {
    id: string
    name: string
    growthPercentage: number
  } | null
}

export interface BalanceDataPoint {
  month: number
  year: number
  value: string
  label: string // e.g., "ינו 2026"
}

export interface DistributionItem {
  label: string
  value: string
  percentage: number
  color: string
}

export interface DashboardWidget {
  id: string
  visible: boolean
  order: number
}

export interface DashboardLayout {
  widgets: DashboardWidget[]
}

// ============================================
// API types
// ============================================

export interface ApiError {
  error: string
  message: string
  details?: Record<string, unknown>
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}

// ============================================
// Sync types for offline support
// ============================================

export type OfflineOperation = 'CREATE' | 'UPDATE' | 'DELETE'
export type OfflineEntityType = 'transaction' | 'category' | 'asset' | 'assetClass' | 'instrument' | 'provider' | 'monthlyValue'
export type OfflineStatus = 'PENDING' | 'SYNCING' | 'FAILED'

export interface SyncConflict {
  assetId: string
  clientValue: string
  serverValue: string
  clientTimestamp: Date
  serverTimestamp: Date
  resolution: 'client_wins' | 'server_wins'
}

export interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: OfflineEntityType
  data: Record<string, unknown>
  timestamp: Date
  synced: boolean
}

export interface OfflineQueueItem {
  id: string
  operation: OfflineOperation
  entityType: OfflineEntityType
  entityId: string
  payload: Record<string, unknown> | null
  createdAt: Date
  status: OfflineStatus
}

export interface SyncOperation {
  id: string
  operation: OfflineOperation
  entityType: OfflineEntityType
  entityId: string
  payload: Record<string, unknown> | null
  clientTimestamp: Date
}

export interface SyncResult {
  operationId: string
  status: 'SUCCESS' | 'CONFLICT_RESOLVED' | 'ERROR'
  entity?: Record<string, unknown>
  error?: string
}

// ============================================
// Reorder types
// ============================================

export interface ReorderItem {
  id: string
  displayOrder: number
  parentId?: string
}

export interface ReorderRequest {
  type: 'assetClass' | 'instrument' | 'provider' | 'asset'
  items: ReorderItem[]
}

// ============================================
// Filter types
// ============================================

export interface DashboardFilters {
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  assetClassId?: string
  instrumentId?: string
  providerId?: string
  isLiquid?: boolean
  currency?: string
}

// ============================================
// Create/Update types for Assets
// ============================================

export interface AssetClassCreate {
  name: string
}

export interface AssetClassUpdate {
  name?: string
  displayOrder?: number
}

export interface InstrumentCreate {
  assetClassId: string
  name: string
}

export interface InstrumentUpdate {
  assetClassId?: string
  name?: string
  displayOrder?: number
}

export interface ProviderCreate {
  instrumentId: string
  name: string
}

export interface ProviderUpdate {
  instrumentId?: string
  name?: string
  displayOrder?: number
}

export interface AssetCreate {
  providerId: string
  name: string
  isLiquid?: boolean
  currency?: string
  notes?: string
}

export interface AssetUpdate {
  providerId?: string
  name?: string
  isLiquid?: boolean
  currency?: string
  notes?: string | null
  displayOrder?: number
}

export interface MonthlyValueSet {
  assetId: string
  month: number
  year: number
  value: string
  updatedAt?: Date
}

// ============================================
// Push notification types
// ============================================

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}
