'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return <div style={{ width: '44px', height: '44px' }} />
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        color: theme === 'dark' ? '#facc15' : '#6366f1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
      }}
      aria-label={theme === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
    >
      {theme === 'dark' ? (
        <Sun size={22} strokeWidth={1.5} />
      ) : (
        <Moon size={22} strokeWidth={1.5} />
      )}
    </button>
  )
}

export default ThemeToggle
