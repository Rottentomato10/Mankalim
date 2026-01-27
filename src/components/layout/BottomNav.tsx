'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'בית', icon: '🏠' },
  { href: '/cashflow', label: 'תזרים', icon: '💸' },
  { href: '/balance', label: 'מאזן', icon: '⚖️' },
  { href: '/dashboard', label: 'דשבורד', icon: '📊' },
  { href: '/settings', label: 'הגדרות', icon: '⚙️' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--card-bg)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '12px 0',
      paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: '480px', margin: '0 auto' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                fontSize: '0.75rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'color 0.2s'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
