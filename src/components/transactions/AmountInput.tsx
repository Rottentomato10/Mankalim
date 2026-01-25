'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number | string
  onChange: (value: number) => void
  error?: string
  label?: string
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, error, label, className = '', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9.]/g, '')
      const numValue = parseFloat(rawValue) || 0
      onChange(numValue)
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-2xl text-accent-green font-bold pointer-events-none">
            ₪
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={value || ''}
            onChange={handleChange}
            className={`
              w-full ps-12 pe-4 py-4
              bg-background/50
              border border-glass-border
              rounded-xl
              text-white text-2xl font-bold text-center
              placeholder-gray-500
              focus:border-accent-blue focus:ring-1 focus:ring-accent-blue
              transition-colors
              ${error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red' : ''}
              ${className}
            `}
            placeholder="0"
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-accent-red">{error}</p>}
      </div>
    )
  }
)

AmountInput.displayName = 'AmountInput'

export default AmountInput
