'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import Image from 'next/image'
import { Shield, Smartphone, BarChart3, Eye, Download, Share } from 'lucide-react'

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsDemoLoading(true)
    try {
      const response = await fetch('/api/auth/demo', { method: 'POST' })
      if (response.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setIsDemoLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '360px' }}>
      {/* Logo and title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Image
          src="/logo-6.png"
          alt="פורשים כנף"
          width={80}
          height={80}
          style={{
            margin: '0 auto 16px',
            borderRadius: '20px',
            objectFit: 'contain'
          }}
          priority
        />
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '2px' }}>פורשים כנף - חינוך פיננסי</p>
        <h1 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px' }}>מנכ״לים</h1>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>ניהול פיננסי אישי - תזרים ונכסים</p>
      </div>

      {/* Login card */}
      <div className="glass-card">
        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(251, 113, 133, 0.15)',
            border: '1px solid var(--expense)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--expense)' }}>
              {error === 'OAuthAccountNotLinked'
                ? 'חשבון Google זה כבר מקושר לחשבון אחר'
                : 'אירעה שגיאה בהתחברות. נסו שנית.'}
            </p>
          </div>
        )}

        {/* Google sign in button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '14px 20px',
            background: '#fff',
            border: 'none',
            borderRadius: '16px',
            color: '#1f2937',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          {isLoading ? (
            <div style={{ width: '20px', height: '20px', border: '2px solid #9ca3af', borderTopColor: '#1f2937', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          <span>התחברות עם Google</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>או</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Demo login button */}
        <button
          onClick={handleDemoLogin}
          disabled={isDemoLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '14px 20px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid var(--accent)',
            borderRadius: '16px',
            color: 'var(--accent)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isDemoLoading ? 'not-allowed' : 'pointer',
            opacity: isDemoLoading ? 0.5 : 1
          }}
        >
          {isDemoLoading ? (
            <div style={{ width: '20px', height: '20px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Eye size={20} strokeWidth={1.5} />
          )}
          <span>כניסה למצב דמו</span>
        </button>

        {/* Terms */}
        <p style={{ margin: '20px 0 0 0', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
          בהתחברות אתם מסכימים ל
          <a href="https://www.porsimkanaf.com/תנאי-שימוש" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', margin: '0 4px' }}>תנאי השימוש</a>
          ול
          <a href="https://www.porsimkanaf.com/מדיניות-פרטיות" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', margin: '0 4px' }}>מדיניות הפרטיות</a>
          |
          <a href="https://www.porsimkanaf.com/הצהרת-נגישות" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', margin: '0 4px' }}>הצהרת נגישות</a>
        </p>
      </div>

      {/* Features */}
      <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
        <div>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto 8px',
            borderRadius: '12px',
            background: 'var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--income)'
          }}>
            <Shield size={20} strokeWidth={1.5} />
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>מאובטח</p>
        </div>
        <div>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto 8px',
            borderRadius: '12px',
            background: 'var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}>
            <Smartphone size={20} strokeWidth={1.5} />
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>מותאם למובייל</p>
        </div>
        <div>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto 8px',
            borderRadius: '12px',
            background: 'var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <BarChart3 size={20} strokeWidth={1.5} />
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>דשבורד</p>
        </div>
      </div>

      {/* Install Instructions */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(56, 189, 248, 0.08)',
        borderRadius: '16px',
        border: '1px solid rgba(56, 189, 248, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Download size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>התקינו כאפליקציה</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
          <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.7rem',
              fontWeight: 600
            }}>iPhone</span>
            <div style={{ marginTop: '6px' }}>
              1. לחצו <Share size={12} style={{ verticalAlign: 'middle', margin: '0 2px' }} /> בתחתית המסך
              <br />
              2. גללו למטה → ״הוסף למסך הבית״
              <br />
              3. לחצו ״הוסף״
            </div>
          </div>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <span style={{
              background: 'rgba(74, 222, 128, 0.15)',
              color: 'var(--income)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.7rem',
              fontWeight: 600
            }}>Android</span>
            <div style={{ marginTop: '6px' }}>
              1. לחצו ⋮ (3 נקודות) למעלה
              <br />
              2. לחצו ״הוסף למסך הבית״
              <br />
              3. לחצו ״הוסף״
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
