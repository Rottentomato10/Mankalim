'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import Image from 'next/image'
import { Eye } from 'lucide-react'

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
    <div style={{ width: '100%', maxWidth: '340px' }}>
      {/* Logo and title */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Image
          src="/logo-6.png"
          alt="פורשים כנף"
          width={72}
          height={72}
          style={{
            margin: '0 auto 20px',
            borderRadius: '16px',
            objectFit: 'contain'
          }}
          priority
        />
        <h1 style={{
          margin: '0 0 6px 0',
          fontSize: '1.75rem',
          fontWeight: 700,
          letterSpacing: '-0.5px',
          color: 'var(--text-main)'
        }}>
          מנכ״לים
        </h1>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          ניהול פיננסי אישי
        </p>
      </div>

      {/* Login card */}
      <div className="card" style={{ padding: '24px' }}>
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid var(--expense)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--expense)' }}>
              {error === 'OAuthAccountNotLinked'
                ? 'חשבון Google זה כבר מקושר לחשבון אחר'
                : 'אירעה שגיאה בהתחברות. נסו שנית.'}
            </p>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: '#fff',
            border: 'none',
            borderRadius: '10px',
            color: '#1f2937',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isLoading ? (
            <div style={{ width: '18px', height: '18px', border: '2px solid #9ca3af', borderTopColor: '#1f2937', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          <span>התחברות עם Google</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>או</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <button
          onClick={handleDemoLogin}
          disabled={isDemoLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--text-dim)',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: isDemoLoading ? 'not-allowed' : 'pointer',
            opacity: isDemoLoading ? 0.5 : 1
          }}
        >
          {isDemoLoading ? (
            <div style={{ width: '18px', height: '18px', border: '2px solid var(--text-dim)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Eye size={18} strokeWidth={1.5} />
          )}
          <span>צפייה במצב דמו</span>
        </button>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
          מבית <span style={{ fontWeight: 600 }}>פורשים כנף</span> — חינוך פיננסי
        </p>
        <div style={{
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
          display: 'flex',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <a href="https://www.porsimkanaf.com/תנאי-שימוש" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
            תנאי שימוש
          </a>
          <span style={{ opacity: 0.3 }}>·</span>
          <a href="https://www.porsimkanaf.com/מדיניות-פרטיות" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
            פרטיות
          </a>
          <span style={{ opacity: 0.3 }}>·</span>
          <a href="https://www.porsimkanaf.com/הצהרת-נגישות" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
            נגישות
          </a>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ width: '100%', maxWidth: '340px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
