'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AmountInput } from './AmountInput'
import { SourceInput } from './SourceInput'
import { DatePicker } from '@/components/ui/DatePicker'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { validateIncome } from '@/utils/validation'

interface IncomeFormProps {
  onSubmit: (data: IncomeFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export interface IncomeFormData {
  amount: number
  source: string
  date: string
  description?: string
}

export function IncomeForm({ onSubmit, onCancel, isLoading }: IncomeFormProps) {
  const [amount, setAmount] = useState<number>(0)
  const [source, setSource] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState<string>('')
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateIncome({
      amount,
      source,
      date,
    })

    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setErrors([])

    await onSubmit({
      amount,
      source,
      date,
      description: description || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AmountInput
          value={amount}
          onChange={setAmount}
          label="סכום"
          autoFocus
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <SourceInput
          value={source}
          onChange={(e) => setSource(e.target.value)}
          label="מקור הכנסה"
          placeholder="למשל: משכורת, מתנה..."
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DatePicker
          value={date}
          onChange={(e) => setDate(e.target.value)}
          label="תאריך"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          label="תיאור (אופציונלי)"
          placeholder="למשל: משכורת ינואר"
        />
      </motion.div>

      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/30"
        >
          {errors.map((error, index) => (
            <p key={index} className="text-accent-red text-sm">
              {error}
            </p>
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3 pt-2"
      >
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
          >
            ביטול
          </Button>
        )}
        <Button
          type="submit"
          variant="success"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'שומר...' : 'הוסף הכנסה'}
        </Button>
      </motion.div>
    </form>
  )
}

export default IncomeForm
