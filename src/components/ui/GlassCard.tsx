'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'small'
  hover?: boolean
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', variant = 'default', hover = false, ...props }, ref) => {
    const baseClasses =
      variant === 'small'
        ? 'glass-card-sm p-4'
        : 'glass-card p-6'

    const hoverClasses = hover
      ? 'hover:border-accent-blue/30 transition-colors cursor-pointer'
      : ''

    return (
      <motion.div
        ref={ref}
        className={`${baseClasses} ${hoverClasses} ${className}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export default GlassCard
