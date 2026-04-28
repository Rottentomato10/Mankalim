'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { ArrowLeftRight, Scale, BarChart3, Settings, LogOut, ChevronLeft, Download, Share, Smartphone, X } from 'lucide-react'
import { Onboarding } from '@/components/Onboarding'

function InstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
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
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '14px',
      marginBottom: '16px',
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
          display: 'flex'
        }}
      >
        <X size={16} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Smartphone size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
            התקן כאפליקציה
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            לחץ <Share size={12} style={{ verticalAlign: 'middle' }} /> ואז ״הוסף למסך הבית״
          </p>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { logout, isDemo } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showInstallTip, setShowInstallTip] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true)

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed')
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true)
    }

    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

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

  const navItems = [
    { href: '/cashflow', label: 'תזרים', desc: 'הכנסות והוצאות', icon: ArrowLeftRight, color: 'var(--income)' },
    { href: '/balance', label: 'מאזן', desc: 'נכסים והתחייבויות', icon: Scale, color: 'var(--accent)' },
    { href: '/dashboard', label: 'דשבורד', desc: 'סיכום וגרפים', icon: BarChart3, color: '#e59500' },
    { href: '/settings', label: 'הגדרות', desc: 'ניהול וקטגוריות', icon: Settings, color: 'var(--text-dim)' },
  ]

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto', minHeight: '100vh' }}>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      <InstallBanner />

      {isDemo && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--expense)' }}>
            מצב צפייה — התחברו עם Google לניהול מלא
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <Image
              src="/logo-6.png"
              alt="פורשים כנף"
              width={36}
              height={36}
              style={{ borderRadius: '8px' }}
              priority
            />
            <h1 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: 'var(--text-main)',
            }}>
              מנכ״לים
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            מבית פורשים כנף
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!isStandalone && (
            <button
              onClick={() => {
                setShowInstallTip(!showInstallTip)
              }}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-dim)',
                padding: '8px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Download size={16} strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
              padding: '8px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Install Tip */}
      {showInstallTip && !isStandalone && (
        <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              התקינו כאפליקציה
            </span>
            <button
              onClick={() => {
                localStorage.setItem('install-tip-dismissed', 'true')
                setShowInstallTip(false)
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ padding: '10px', background: 'var(--hover-bg)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)' }}>iPhone</span>
              <div style={{ marginTop: '4px' }}>
                <Share size={11} style={{ verticalAlign: 'middle' }} /> → הוסף למסך הבית
              </div>
            </div>
            <div style={{ padding: '10px', background: 'var(--hover-bg)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--income)' }}>Android</span>
              <div style={{ marginTop: '4px' }}>
                ⋮ → הוסף למסך הבית
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--hover-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: item.color
                }}>
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1px' }}>{item.desc}</div>
                </div>
                <ChevronLeft size={18} style={{ color: 'var(--text-dim)', opacity: 0.4 }} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* External Link */}
      <a
        href="https://www.porsimkanaf.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '10px',
          color: 'var(--text-dim)',
          textDecoration: 'none',
          fontSize: '0.8rem',
          marginBottom: '8px',
        }}
      >
        porsimkanaf.com ←
      </a>

      {/* Legal */}
      <div style={{
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'var(--text-dim)',
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        opacity: 0.6
      }}>
        <a href="https://www.porsimkanaf.com/תנאי-שימוש" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>תנאי שימוש</a>
        <span>·</span>
        <a href="https://www.porsimkanaf.com/מדיניות-פרטיות" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>פרטיות</a>
        <span>·</span>
        <a href="https://www.porsimkanaf.com/הצהרת-נגישות" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>נגישות</a>
      </div>
    </div>
  )
}
