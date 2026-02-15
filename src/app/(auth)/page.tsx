'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { ArrowLeftRight, Scale, BarChart3, Settings, Smartphone, ExternalLink, LogOut, Share, X } from 'lucide-react'
import { Onboarding } from '@/components/Onboarding'

function InstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone) or dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isDismissed = localStorage.getItem('pwa-install-dismissed')
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)

    if (!isStandalone && !isDismissed && isIOS) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(129, 140, 248, 0.15))',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '20px',
      position: 'relative'
    }}>
      <button
        onClick={() => {
          localStorage.setItem('pwa-install-dismissed', 'true')
          setShow(false)
        }}
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          background: 'none',
          border: 'none',
          color: 'var(--text-dim)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={18} strokeWidth={2} />
      </button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
          <Smartphone size={32} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700 }}>
          התקן את האפליקציה
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          לחץ על
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            margin: '0 6px',
            padding: '2px 8px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '6px'
          }}>
            <Share size={18} strokeWidth={2} />
          </span>
          ואז <strong>הוסף למסך הבית</strong>
        </p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { logout, isDemo } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed')
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto', minHeight: '100vh' }}>
      {/* Onboarding for first-time users */}
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      {/* Install PWA Banner */}
      <InstallBanner />

      {/* Demo Warning Banner */}
      {isDemo && (
        <div style={{
          background: 'rgba(251, 113, 133, 0.15)',
          border: '1px solid var(--expense)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--expense)' }}>
            מצב צפייה בלבד - התחברו עם Google כדי לנהל את הכספים שלכם
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
        <button
          onClick={handleLogout}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-dim)',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <LogOut size={16} strokeWidth={1.5} />
          יציאה
        </button>
        <Image
          src="/logo-6.png"
          alt="פורשים כנף"
          width={64}
          height={64}
          style={{ marginBottom: '12px', borderRadius: '16px' }}
          priority
        />
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '2.5rem',
          fontWeight: 800,
          letterSpacing: '-1px',
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          מנכ״לים
        </h1>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          מבית <strong style={{ color: '#fff' }}>פורשים כנף</strong> - חינוך פיננסי
        </p>
      </div>

      {/* Main Explanation Card */}
      <div className="glass-card" style={{
        padding: '28px 24px',
        textAlign: 'center',
        marginBottom: '24px',
        background: 'rgba(56, 189, 248, 0.05)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '1.3rem',
          fontWeight: 700,
          color: '#fff'
        }}>
          ניהול הכספים האישיים שלכם
        </h2>
        <p style={{
          margin: 0,
          color: 'var(--text-dim)',
          fontSize: '1rem',
          lineHeight: 1.8
        }}>
          עקוב אחרי ההוצאות וההכנסות החודשיות,
          <br />
          נהלו את כל הנכסים שלכם במקום אחד,
          <br />
          וקבל תמונה ברורה של המצב הפיננסי.
        </p>
      </div>

      {/* Navigation Buttons - 2x2 Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <Link href="/cashflow" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{
            padding: '24px 16px',
            textAlign: 'center',
            cursor: 'pointer',
          }}>
            <div style={{
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'center',
              color: 'var(--income)'
            }}>
              <ArrowLeftRight size={28} strokeWidth={1.5} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>תזרים</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>הכנסות והוצאות</div>
          </div>
        </Link>

        <Link href="/balance" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{
            padding: '24px 16px',
            textAlign: 'center',
            cursor: 'pointer',
          }}>
            <div style={{
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'center',
              color: 'var(--accent)'
            }}>
              <Scale size={28} strokeWidth={1.5} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>מאזן</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>נכסים והתחייבויות</div>
          </div>
        </Link>

        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{
            padding: '24px 16px',
            textAlign: 'center',
            cursor: 'pointer',
          }}>
            <div style={{
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'center',
              color: '#f59e0b'
            }}>
              <BarChart3 size={28} strokeWidth={1.5} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>דשבורד</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>סיכום וגרפים</div>
          </div>
        </Link>

        <Link href="/settings" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{
            padding: '24px 16px',
            textAlign: 'center',
            cursor: 'pointer',
          }}>
            <div style={{
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'center',
              color: 'var(--text-dim)'
            }}>
              <Settings size={28} strokeWidth={1.5} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>הגדרות</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ניהול וקטגוריות</div>
          </div>
        </Link>
      </div>

      {/* External Link */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <a
          href="https://www.porsimkanaf.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '24px',
            color: 'var(--accent)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          <ExternalLink size={16} strokeWidth={1.5} />
          לאתר פורשים כנף
        </a>
      </div>

      {/* Legal Links */}
      <div style={{
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
        display: 'flex',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <a
          href="https://www.porsimkanaf.com/תנאי-שימוש"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--text-dim)', textDecoration: 'none' }}
        >
          תנאי שימוש
        </a>
        <span>|</span>
        <a
          href="https://www.porsimkanaf.com/מדיניות-פרטיות"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--text-dim)', textDecoration: 'none' }}
        >
          מדיניות פרטיות
        </a>
      </div>
    </div>
  )
}
