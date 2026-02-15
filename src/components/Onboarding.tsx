'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowLeftRight, Scale, BarChart3, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface OnboardingSlide {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

const slides: OnboardingSlide[] = [
  {
    icon: <Sparkles size={48} strokeWidth={1.5} />,
    title: 'ברוכים הבאים למנכ״לים!',
    description: 'האפליקציה שתעזור לכם לנהל את הכספים האישיים שלכם בצורה פשוטה וברורה.',
    color: 'var(--accent)',
  },
  {
    icon: <ArrowLeftRight size={48} strokeWidth={1.5} />,
    title: 'תזרים מזומנים',
    description: 'עקבו אחרי ההכנסות וההוצאות החודשיות שלכם. הוסיפו פריטים בקלות וראו לאן הכסף הולך.',
    color: 'var(--income)',
  },
  {
    icon: <Scale size={48} strokeWidth={1.5} />,
    title: 'מאזן נכסים',
    description: 'נהלו את כל הנכסים שלכם במקום אחד - פנסיה, השקעות, נדל״ן ועוד. עדכנו ערכים כל חודש.',
    color: 'var(--accent)',
  },
  {
    icon: <BarChart3 size={48} strokeWidth={1.5} />,
    title: 'דשבורד וגרפים',
    description: 'קבלו תמונה ברורה של המצב הפיננסי שלכם עם גרפים וסיכומים חודשיים.',
    color: '#f59e0b',
  },
]

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    setTimeout(() => {
      localStorage.setItem('onboarding-completed', 'true')
      onComplete()
    }, 300)
  }

  const slide = slides[currentSlide]
  const isLastSlide = currentSlide === slides.length - 1

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Skip button */}
      <button
        onClick={handleComplete}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dim)',
          cursor: 'pointer',
        }}
        aria-label="דלג"
      >
        <X size={20} />
      </button>

      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <Image
          src="/logo-6.png"
          alt="מנכ״לים"
          width={56}
          height={56}
          style={{ borderRadius: '14px', marginBottom: '32px' }}
          priority
        />

        {/* Slide content */}
        <div
          key={currentSlide}
          style={{
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '96px',
              height: '96px',
              margin: '0 auto 24px',
              borderRadius: '24px',
              background: `linear-gradient(135deg, ${slide.color}20, ${slide.color}10)`,
              border: `1px solid ${slide.color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: slide.color,
            }}
          >
            {slide.icon}
          </div>

          {/* Title */}
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {slide.title}
          </h2>

          {/* Description */}
          <p
            style={{
              margin: '0 0 40px 0',
              fontSize: '1rem',
              color: 'var(--text-dim)',
              lineHeight: 1.7,
            }}
          >
            {slide.description}
          </p>
        </div>

        {/* Dots indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '32px',
          }}
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: index === currentSlide ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: index === currentSlide ? 'var(--accent)' : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              aria-label={`שקופית ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          {currentSlide > 0 && (
            <button
              onClick={handlePrev}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <ChevronRight size={20} />
              הקודם
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              flex: currentSlide === 0 ? 1 : 2,
              padding: '16px',
              borderRadius: '16px',
              background: isLastSlide
                ? 'linear-gradient(135deg, var(--accent), #818cf8)'
                : 'var(--accent)',
              border: 'none',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isLastSlide ? 'בוא נתחיל!' : 'הבא'}
            {!isLastSlide && <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default Onboarding
