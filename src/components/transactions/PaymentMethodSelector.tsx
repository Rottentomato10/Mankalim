'use client'

import { motion } from 'framer-motion'

type PaymentMethod = 'CASH' | 'CARD'

interface PaymentMethodSelectorProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  error?: string
}

export function PaymentMethodSelector({
  value,
  onChange,
  error,
}: PaymentMethodSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        אמצעי תשלום
      </label>
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange('CASH')}
          className={`
            flex items-center justify-center gap-2
            p-4 rounded-xl
            transition-all duration-200
            ${
              value === 'CASH'
                ? 'bg-accent-green/20 border-2 border-accent-green'
                : 'bg-glass border border-glass-border hover:border-white/20'
            }
          `}
        >
          <span className="text-2xl">💵</span>
          <span className="font-medium">מזומן</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange('CARD')}
          className={`
            flex items-center justify-center gap-2
            p-4 rounded-xl
            transition-all duration-200
            ${
              value === 'CARD'
                ? 'bg-accent-blue/20 border-2 border-accent-blue'
                : 'bg-glass border border-glass-border hover:border-white/20'
            }
          `}
        >
          <span className="text-2xl">💳</span>
          <span className="font-medium">כרטיס</span>
        </motion.button>
      </div>
      {error && <p className="mt-2 text-sm text-accent-red">{error}</p>}
    </div>
  )
}

export default PaymentMethodSelector
