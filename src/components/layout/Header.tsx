'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useDemoSession } from '@/hooks/useDemoSession'

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

  const handleSignOut = () => {
    if (isDemo) {
      signOutDemo()
    } else {
      signOut({ callbackUrl: '/login' })
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        הגדרות
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#ff7e8e] hover:bg-[#ff7e8e]/5 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
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
