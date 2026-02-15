'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { Onboarding } from './Onboarding'

export function HelpButton() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleClick = () => {
    setShowOnboarding(!showOnboarding)
  }

  const handleComplete = () => {
    setShowOnboarding(false)
  }

  return (
    <>
      <button
        onClick={handleClick}
        style={{
          position: 'fixed',
          bottom: showOnboarding ? '40px' : 'calc(90px + env(safe-area-inset-bottom, 0px))',
          left: showOnboarding ? '50%' : '16px',
          transform: showOnboarding ? 'translateX(-50%)' : 'none',
          width: showOnboarding ? '56px' : '44px',
          height: showOnboarding ? '56px' : '44px',
          borderRadius: '50%',
          background: showOnboarding ? 'var(--expense)' : 'var(--card-bg)',
          border: `1px solid ${showOnboarding ? 'var(--expense)' : 'rgba(255, 255, 255, 0.15)'}`,
          color: showOnboarding ? '#fff' : 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1001,
          boxShadow: showOnboarding ? '0 6px 20px rgba(251, 113, 133, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          if (!showOnboarding) {
            e.currentTarget.style.color = 'var(--accent)'
            e.currentTarget.style.borderColor = 'var(--accent)'
          }
        }}
        onMouseLeave={(e) => {
          if (!showOnboarding) {
            e.currentTarget.style.color = 'var(--text-dim)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
          }
        }}
        aria-label={showOnboarding ? 'סגור עזרה' : 'עזרה'}
      >
        {showOnboarding ? <X size={24} strokeWidth={2.5} /> : <HelpCircle size={22} strokeWidth={1.5} />}
      </button>

      {showOnboarding && <Onboarding onComplete={handleComplete} />}
    </>
  )
}

export default HelpButton
