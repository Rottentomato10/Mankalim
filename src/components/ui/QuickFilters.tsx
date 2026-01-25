'use client'

interface FilterOption {
  value: string
  label: string
}

interface QuickFiltersProps {
  assetClasses: { id: string; name: string }[]
  filters: {
    assetClass: string | null
    isLiquid: boolean | null
    currency: string | null
  }
  onFilterChange: (filters: {
    assetClass: string | null
    isLiquid: boolean | null
    currency: string | null
  }) => void
}

const LIQUIDITY_OPTIONS: FilterOption[] = [
  { value: 'true', label: 'נזיל' },
  { value: 'false', label: 'לא נזיל' },
]

export function QuickFilters({ assetClasses, filters, onFilterChange }: QuickFiltersProps) {
  const handleAssetClassChange = (value: string | null) => {
    onFilterChange({ ...filters, assetClass: value })
  }

  const handleLiquidityChange = (value: string | null) => {
    onFilterChange({
      ...filters,
      isLiquid: value === null ? null : value === 'true',
    })
  }

  const clearFilters = () => {
    onFilterChange({ assetClass: null, isLiquid: null, currency: null })
  }

  const hasActiveFilters = filters.assetClass || filters.isLiquid !== null

  const chipStyle = (isActive: boolean) => ({
    padding: '6px 12px',
    borderRadius: '16px',
    border: 'none',
    background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
    color: isActive ? 'var(--accent)' : 'var(--text-dim)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  })

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Filter header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>סינון מהיר</span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(251, 113, 133, 0.15)',
              color: 'var(--expense)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            נקה הכל
          </button>
        )}
      </div>

      {/* Filter rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Asset Class filters */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          <button
            onClick={() => handleAssetClassChange(null)}
            style={chipStyle(filters.assetClass === null)}
          >
            הכל
          </button>
          {assetClasses.map((ac) => (
            <button
              key={ac.id}
              onClick={() => handleAssetClassChange(ac.id)}
              style={chipStyle(filters.assetClass === ac.id)}
            >
              {ac.name}
            </button>
          ))}
        </div>

        {/* Liquidity filters */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          {LIQUIDITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleLiquidityChange(
                filters.isLiquid === (opt.value === 'true') ? null : opt.value
              )}
              style={chipStyle(filters.isLiquid === (opt.value === 'true'))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuickFilters
