'use client'

import { motion } from 'framer-motion'

interface Category {
  id: string
  name: string
}

interface CategorySelectorProps {
  categories: Category[]
  value: string | null
  onChange: (categoryId: string) => void
  error?: string
}

// Category icons/emojis for visual distinction
const categoryIcons: Record<string, string> = {
  'אוכל': '🍽️',
  'תחבורה': '🚌',
  'בילויים': '🎉',
  'קניות': '🛍️',
  'חשבונות': '📄',
  'בריאות': '💊',
  'לימודים': '📚',
  'אחר': '📦',
}

export function CategorySelector({
  categories,
  value,
  onChange,
  error,
}: CategorySelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        קטגוריה
      </label>
      <div className="grid grid-cols-4 gap-2">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(category.id)}
            className={`
              flex flex-col items-center justify-center
              p-3 rounded-xl
              transition-all duration-200
              ${
                value === category.id
                  ? 'bg-accent-blue/20 border-2 border-accent-blue'
                  : 'bg-glass border border-glass-border hover:border-white/20'
              }
            `}
          >
            <span className="text-2xl mb-1">
              {categoryIcons[category.name] || '📦'}
            </span>
            <span className="text-xs text-white/80 truncate w-full text-center">
              {category.name}
            </span>
          </motion.button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-accent-red">{error}</p>}
    </div>
  )
}

export default CategorySelector
