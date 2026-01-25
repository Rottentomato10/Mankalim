'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'income' | 'expense' | 'ghost' | 'outline' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent-blue text-background hover:bg-accent-blue/90',
  income: 'bg-accent-green text-background hover:bg-accent-green/90',
  expense: 'bg-accent-red text-background hover:bg-accent-red/90',
  success: 'bg-accent-green text-background hover:bg-accent-green/90',
  danger: 'bg-accent-red text-background hover:bg-accent-red/90',
  ghost: 'bg-transparent hover:bg-white/10',
  outline: 'bg-transparent border-2 border-accent-blue text-accent-blue hover:bg-accent-blue/10',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-2xl',
  xl: 'px-8 py-4 text-xl rounded-3xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'font-medium transition-all duration-200 flex items-center justify-center gap-2'
    const widthClass = fullWidth ? 'w-full' : ''
    const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : ''

    return (
      <motion.button
        ref={ref}
        className={`${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${widthClass} ${disabledClass} ${className}`}
        disabled={disabled || loading}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : null}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
