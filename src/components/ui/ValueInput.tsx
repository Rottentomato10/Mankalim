'use client'

import { useState, useRef, useEffect } from 'react'

interface ValueInputProps {
  value: string
  currency: string
  isInherited?: boolean
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
}

// Format number with commas as thousands separator
const formatWithCommas = (value: string): string => {
  // Check for negative sign
  const isNegative = value.startsWith('-')

  // Remove all non-digit and non-decimal characters
  const cleanValue = value.replace(/[^\d.]/g, '')

  // Split by decimal point
  const parts = cleanValue.split('.')

  // Format integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // Return formatted value (with decimal if exists)
  const formatted = parts.length > 1 ? parts.join('.') : parts[0]
  return isNegative ? '-' + formatted : formatted
}

// Get raw number from formatted string
const getRawNumber = (value: string): string => {
  return value.replace(/,/g, '')
}

export function ValueInput({ value, currency, isInherited, onChange, onBlur, disabled }: ValueInputProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(formatWithCommas(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(formatWithCommas(value))
    }
  }, [value, isEditing])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Allow only digits, commas, decimal point, and minus at start
    const isNegative = input.startsWith('-')
    const cleaned = input.replace(/[^\d.,]/g, '')
    // Format with commas
    const formatted = formatWithCommas((isNegative ? '-' : '') + cleaned)
    setLocalValue(formatted)
  }

  const handleBlur = () => {
    setIsEditing(false)
    const rawValue = getRawNumber(localValue)
    const numValue = parseFloat(rawValue)
    if (!isNaN(numValue)) {
      onChange(numValue.toString())
    } else {
      setLocalValue(formatWithCommas(value))
    }
    onBlur?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setLocalValue(formatWithCommas(value))
      setIsEditing(false)
    }
  }

  const formatDisplayValue = (val: string) => {
    const num = parseFloat(val)
    if (isNaN(num)) return '0'
    return new Intl.NumberFormat('he-IL', { signDisplay: 'auto' }).format(num)
  }

  const symbol = CURRENCY_SYMBOLS[currency] || currency

  if (isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{symbol}</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: '110px',
            padding: '6px 8px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid var(--accent)',
            color: '#fff',
            textAlign: 'left',
            fontWeight: 500,
            fontSize: '0.95rem',
            outline: 'none'
          }}
          dir="ltr"
        />
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 8px',
        borderRadius: '8px',
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'text',
        opacity: disabled ? 0.5 : 1,
        color: isInherited ? 'var(--text-dim)' : '#fff',
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{symbol}</span>
      <span style={{ fontWeight: 500 }} dir="ltr">
        {formatDisplayValue(value)}
      </span>
      {isInherited && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginRight: '4px' }} title="ערך מורש מחודש קודם">
          ⤵
        </span>
      )}
    </button>
  )
}

export default ValueInput
