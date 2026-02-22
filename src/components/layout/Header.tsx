'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useDemoSession } from '@/hooks/useDemoSession'
import { ChevronRight, Settings, LogOut } from 'lucide-react'

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#111827]/90 backdrop-blur-xl border-b border-[#2d3748]">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="w-10 flex items-center justify-start">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="p-2 -m-2 text-[#9ca3af] hover:text-white transition-colors"
              aria-label="חזרה"
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          )}
        </div>

        <h1 className="text-lg font-semibold text-white">{title}</h1>

        <div className="w-10 flex items-center justify-end relative">
          {user && (
            <>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#2d3748] hover:ring-[#38bdf8]/50 transition-all"
              >
                {user.image ? (
                  <Image src={user.image} alt={user.name || 'משתמש'} width={32} height={32} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] text-sm font-medium">
                    {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                  </div>
                )}
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 w-48 bg-[#1f2937] border border-[#2d3748] rounded-2xl shadow-lg shadow-black/30 overflow-hidden z-50">
                    <div className="p-3 border-b border-[#2d3748]">
                      <p className="text-sm text-white font-medium truncate">
                        {user.name || 'משתמש'}
                        {isDemo && <span className="text-[#38bdf8] text-xs mr-1">(דמו)</span>}
                      </p>
                      <p className="text-xs text-[#6b7280] truncate">{user.email}</p>
                    </div>
                    <nav className="py-1">
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-[#9ca3af] hover:bg-white/5 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings size={16} strokeWidth={1.5} />
                        הגדרות
                      </Link>
                      <button
                        onClick={(e) => handleSignOut(e)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#ff7e8e] hover:bg-[#ff7e8e]/5 transition-colors"
                      >
                        <LogOut size={16} strokeWidth={1.5} />
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
