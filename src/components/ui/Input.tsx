'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  inputPrefix?: React.ReactNode
  inputSuffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, inputPrefix, inputSuffix, className = '', id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s+/g, '-').toLowerCase()

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
        <div className="relative">
          {inputPrefix && (
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-gray-400">
              {inputPrefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3
              bg-background/50
              border border-glass-border
              rounded-xl
              text-white
              placeholder-gray-500
              focus:border-accent-blue focus:ring-1 focus:ring-accent-blue
              transition-colors
              ${inputPrefix ? 'ps-10' : ''}
              ${inputSuffix ? 'pe-10' : ''}
              ${error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red' : ''}
              ${className}
            `}
            {...props}
          />
          {inputSuffix && (
            <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-gray-400">
              {inputSuffix}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-accent-red">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
