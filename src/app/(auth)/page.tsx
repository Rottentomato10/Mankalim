'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { ArrowLeftRight, Scale, BarChart3, Settings, Smartphone, ExternalLink, LogOut, Share, X, Download } from 'lucide-react'
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
  const [showInstallTip, setShowInstallTip] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true) // Hide by default until checked

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed')
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true)
    }

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Auto-show install tip on first visit (if not standalone and not dismissed)
    if (!standalone) {
      const installTipDismissed = localStorage.getItem('install-tip-dismissed')
      if (!installTipDismissed) {
        setShowInstallTip(true)
      }
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
        {/* Left buttons - Logout and Install */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-dim)',
              padding: '8px 12px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={16} strokeWidth={1.5} />
            יציאה
          </button>

          {/* Install button - only show if not in standalone mode */}
          {!isStandalone && (
            <button
              onClick={() => setShowInstallTip(!showInstallTip)}
              style={{
                background: showInstallTip ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: 'var(--accent)',
                padding: '8px 12px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500
              }}
            >
              <Download size={16} strokeWidth={1.5} />
              התקנה
            </button>
          )}
        </div>

        {/* Install Tip Popup */}
        {showInstallTip && !isStandalone && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: '50px',
            background: 'var(--card-bg)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            padding: '20px',
            width: '260px',
            zIndex: 100,
            textAlign: 'right',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                onClick={() => {
                  localStorage.setItem('install-tip-dismissed', 'true')
                  setShowInstallTip(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={18} />
              </button>
              <span style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={18} style={{ color: 'var(--accent)' }} />
                התקינו כאפליקציה
              </span>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              הוסיפו את האפליקציה למסך הבית לגישה מהירה וחוויה טובה יותר
            </p>
            <div style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.8 }}>
              <div style={{
                marginBottom: '12px',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px'
              }}>
                <span style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: 'var(--accent)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>iPhone</span>
                <div style={{ marginTop: '8px', color: 'var(--text-dim)' }}>
                  לחצו על <Share size={14} style={{ verticalAlign: 'middle', margin: '0 4px', color: 'var(--accent)' }} /> למטה
                  <br />
                  ואז ״<strong style={{ color: '#fff' }}>הוסף למסך הבית</strong>״
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px'
              }}>
                <span style={{
                  background: 'rgba(74, 222, 128, 0.2)',
                  color: 'var(--income)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>Android</span>
                <div style={{ marginTop: '8px', color: 'var(--text-dim)' }}>
                  לחצו על <strong style={{ color: '#fff' }}>⋮</strong> למעלה
                  <br />
                  ואז ״<strong style={{ color: '#fff' }}>הוספה למסך הבית</strong>״
                </div>
              </div>
            </div>
          </div>
        )}
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
