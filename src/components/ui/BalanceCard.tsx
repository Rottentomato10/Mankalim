'use client'

import { motion } from 'framer-motion'
import { GlassCard } from './GlassCard'
import { formatCurrency } from '@/utils/format'

interface BalanceCardProps {
  balance: number
  totalIncome?: number
  totalExpenses?: number
  isLoading?: boolean
}

export function BalanceCard({
  balance,
  totalIncome = 0,
  totalExpenses = 0,
  isLoading,
}: BalanceCardProps) {
  const isPositive = balance >= 0

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-24 mb-4" />
          <div className="h-10 bg-white/10 rounded w-32 mb-4" />
          <div className="flex justify-between">
            <div className="h-4 bg-white/10 rounded w-20" />
            <div className="h-4 bg-white/10 rounded w-20" />
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6 overflow-hidden relative">
      {/* Background gradient based on balance */}
      <div
        className={`absolute inset-0 opacity-10 ${
          isPositive
            ? 'bg-gradient-to-br from-accent-green to-transparent'
            : 'bg-gradient-to-br from-accent-red to-transparent'
        }`}
      />

      <div className="relative z-10">
        <p className="text-white/60 text-sm mb-1">יתרה נוכחית</p>

        <motion.p
          key={balance}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-4xl font-bold mb-4 ${
            isPositive ? 'text-accent-green' : 'text-accent-red'
          }`}
        >
          {formatCurrency(balance)}
        </motion.p>

        <div className="flex justify-between text-sm">
          <div>
            <p className="text-white/40">הכנסות</p>
            <p className="text-accent-green font-medium">
              +{formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="text-left">
            <p className="text-white/40">הוצאות</p>
            <p className="text-accent-red font-medium">
              -{formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export default BalanceCard
