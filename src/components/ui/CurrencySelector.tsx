'use client'

const CURRENCIES = [
  { code: 'ILS', name: 'שקל', symbol: '₪' },
  { code: 'USD', name: 'דולר', symbol: '$' },
  { code: 'EUR', name: 'יורו', symbol: '€' },
]

interface CurrencySelectorProps {
  value: string
  onChange: (currency: string) => void
  disabled?: boolean
}

export function CurrencySelector({ value, onChange, disabled = false }: CurrencySelectorProps) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {CURRENCIES.map((currency) => (
        <button
          key={currency.code}
          type="button"
          onClick={() => !disabled && onChange(currency.code)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '16px 12px',
            borderRadius: '14px',
            border: currency.code === value
              ? '2px solid var(--accent)'
              : '1px solid rgba(255,255,255,0.1)',
            background: currency.code === value
              ? 'rgba(56, 189, 248, 0.15)'
              : 'rgba(255,255,255,0.03)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: currency.code === value ? 'var(--accent)' : '#fff'
          }}>
            {currency.symbol}
          </span>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: currency.code === value ? 'var(--accent)' : '#fff'
            }}>
              {currency.code}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: currency.code === value ? 'var(--accent)' : 'var(--text-dim)',
              opacity: 0.8
            }}>
              {currency.name}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default CurrencySelector
