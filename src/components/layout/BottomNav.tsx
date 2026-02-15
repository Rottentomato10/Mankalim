'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, Scale, BarChart3, Settings, type LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { href: '/', label: 'בית', icon: Home },
  { href: '/cashflow', label: 'תזרים', icon: ArrowLeftRight },
  { href: '/balance', label: 'מאזן', icon: Scale },
  { href: '/dashboard', label: 'דשבורד', icon: BarChart3 },
  { href: '/settings', label: 'הגדרות', icon: Settings },
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
          const Icon = item.icon
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
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
