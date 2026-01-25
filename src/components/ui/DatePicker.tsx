'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s+/g, '-').toLowerCase()

    // Get today's date in YYYY-MM-DD format for max attribute
    const today = new Date().toISOString().split('T')[0]

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="date"
          id={inputId}
          max={today}
          className={`
            w-full px-4 py-3
            bg-background/50
            border border-glass-border
            rounded-xl
            text-white
            focus:border-accent-blue focus:ring-1 focus:ring-accent-blue
            transition-colors
            cursor-pointer
            ${error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red' : ''}
            ${className}
          `}
          style={{
            colorScheme: 'dark',
          }}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-accent-red">{error}</p>}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'

export default DatePicker
