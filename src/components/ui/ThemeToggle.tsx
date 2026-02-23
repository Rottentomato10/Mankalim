'use client'

import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return <div className="w-10 h-10" />
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
      style={{
        background: theme === 'dark'
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(99, 102, 241, 0.15)',
        border: theme === 'dark'
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(99, 102, 241, 0.3)',
      }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      aria-label={theme === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-yellow-400" />
      ) : (
        <Moon size={18} className="text-indigo-600" />
      )}
    </motion.button>
  )
}

export default ThemeToggle
