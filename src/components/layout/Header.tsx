'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useDemoSession } from '@/hooks/useDemoSession'
import { ChevronRight, Settings, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface HeaderProps {
  title?: string
  showBackButton?: boolean
  onBackClick?: () => void
}

export function Header({ title = 'מאזנים', showBackButton = false, onBackClick }: HeaderProps) {
  const { data: session } = useSession()
  const { demoUser, signOutDemo } = useDemoSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const user = session?.user || demoUser
  const isDemo = !session?.user && !!demoUser

  const handleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    if (isDemo) {
      await signOutDemo()
    } else {
      await signOut({ callbackUrl: '/login' })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
        <div className="w-8 flex items-center justify-start">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="p-1.5 -m-1.5 transition-colors"
              style={{ color: 'var(--text-dim)' }}
              aria-label="חזרה"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        <h1 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{title}</h1>

        <div className="flex items-center gap-2 justify-end relative">
          <ThemeToggle />
          {user && (
            <>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-7 h-7 rounded-full overflow-hidden ring-1 transition-all"
                style={{ '--tw-ring-color': 'var(--border)' } as React.CSSProperties}
              >
                {user.image ? (
                  <Image src={user.image} alt={user.name || 'משתמש'} width={28} height={28} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-medium" style={{ background: 'var(--hover-bg)', color: 'var(--text-dim)' }}>
                    {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                  </div>
                )}
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 w-44 rounded-xl overflow-hidden z-50" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                    <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-main)' }}>
                        {user.name || 'משתמש'}
                        {isDemo && <span style={{ color: 'var(--accent)' }} className="text-xs mr-1">(דמו)</span>}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{user.email}</p>
                    </div>
                    <nav className="py-1">
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:opacity-80 transition-colors"
                        style={{ color: 'var(--text-dim)' }}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings size={14} strokeWidth={1.5} />
                        הגדרות
                      </Link>
                      <button
                        onClick={(e) => handleSignOut(e)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:opacity-80 transition-colors"
                        style={{ color: 'var(--expense)' }}
                      >
                        <LogOut size={14} strokeWidth={1.5} />
                        התנתקות
                      </button>
                    </nav>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
