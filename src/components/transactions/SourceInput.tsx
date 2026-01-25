'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface SourceInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  suggestions?: string[]
}

// Common income sources in Hebrew
const DEFAULT_SUGGESTIONS = [
  'משכורת',
  'מתנה',
  'פרילנס',
  'החזר',
  'מלגה',
  'כיס',
]

export const SourceInput = forwardRef<HTMLInputElement, SourceInputProps>(
  ({ label, error, suggestions = DEFAULT_SUGGESTIONS, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="text"
          list="income-sources"
          className={`
            w-full px-4 py-3
            bg-background/50
            border border-glass-border
            rounded-xl
            text-white
            placeholder-gray-500
            focus:border-accent-green focus:ring-1 focus:ring-accent-green
            transition-colors
            ${error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red' : ''}
            ${className}
          `}
          {...props}
        />
        <datalist id="income-sources">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
        {error && <p className="mt-1 text-sm text-accent-red">{error}</p>}
      </div>
    )
  }
)

SourceInput.displayName = 'SourceInput'

export default SourceInput
