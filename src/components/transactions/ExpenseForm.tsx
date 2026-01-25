'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AmountInput } from './AmountInput'
import { CategorySelector } from './CategorySelector'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import { DatePicker } from '@/components/ui/DatePicker'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { validateExpense } from '@/utils/validation'

interface Category {
  id: string
  name: string
}

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export interface ExpenseFormData {
  amount: number
  categoryId: string
  paymentMethod: 'CASH' | 'CARD'
  date: string
  description?: string
}

export function ExpenseForm({ onSubmit, onCancel, isLoading }: ExpenseFormProps) {
  const [amount, setAmount] = useState<number>(0)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CARD')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (data.categories) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateExpense({
      amount,
      categoryId,
      paymentMethod,
      date,
    })

    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setErrors([])

    await onSubmit({
      amount,
      categoryId: categoryId!,
      paymentMethod,
      date,
      description: description || undefined,
    })
  }

  if (isLoadingCategories) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
        <CategorySelector
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={setPaymentMethod}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
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
        transition={{ delay: 0.3 }}
      >
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          label="תיאור (אופציונלי)"
          placeholder="למשל: ארוחת צהריים"
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
        transition={{ delay: 0.35 }}
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
          variant="danger"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'שומר...' : 'הוסף הוצאה'}
        </Button>
      </motion.div>
    </form>
  )
}

export default ExpenseForm
