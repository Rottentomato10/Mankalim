'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Accessibility,
  X,
  Sun,
  Moon,
  Contrast,
  Eye,
  EyeOff,
  Type,
  Link2,
  MousePointer2,
  BookOpen,
  RotateCcw,
  Volume2,
} from 'lucide-react'

interface AccessibilitySettings {
  fontSize: number
  letterSpacing: number
  wordSpacing: number
  lineHeight: number
  highContrast: boolean
  invertedContrast: boolean
  grayscale: boolean
  blackAndWhite: boolean
  highlightLinks: boolean
  highlightHeadings: boolean
  readableFont: boolean
  hideImages: boolean
  stopAnimations: boolean
  largeCursor: boolean
  brightCursor: boolean
  readingGuide: boolean
  screenReaderMode: boolean
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  letterSpacing: 0,
  wordSpacing: 0,
  lineHeight: 100,
  highContrast: false,
  invertedContrast: false,
  grayscale: false,
  blackAndWhite: false,
  highlightLinks: false,
  highlightHeadings: false,
  readableFont: false,
  hideImages: false,
  stopAnimations: false,
  largeCursor: false,
  brightCursor: false,
  readingGuide: false,
  screenReaderMode: false,
}

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [readingGuideY, setReadingGuideY] = useState(0)

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibility-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings({ ...defaultSettings, ...parsed })
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, [])

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    // Font size
    root.style.fontSize = `${settings.fontSize}%`

    // Letter spacing
    body.style.letterSpacing = settings.letterSpacing ? `${settings.letterSpacing}px` : ''

    // Word spacing
    body.style.wordSpacing = settings.wordSpacing ? `${settings.wordSpacing}px` : ''

    // Line height
    body.style.lineHeight = settings.lineHeight !== 100 ? `${settings.lineHeight * 1.5 / 100}` : ''

    // CSS classes
    body.classList.toggle('a11y-high-contrast', settings.highContrast)
    body.classList.toggle('a11y-inverted', settings.invertedContrast)
    body.classList.toggle('a11y-grayscale', settings.grayscale)
    body.classList.toggle('a11y-black-white', settings.blackAndWhite)
    body.classList.toggle('a11y-highlight-links', settings.highlightLinks)
    body.classList.toggle('a11y-highlight-headings', settings.highlightHeadings)
    body.classList.toggle('a11y-readable-font', settings.readableFont)
    body.classList.toggle('a11y-hide-images', settings.hideImages)
    body.classList.toggle('a11y-stop-animations', settings.stopAnimations)
    body.classList.toggle('a11y-large-cursor', settings.largeCursor)
    body.classList.toggle('a11y-bright-cursor', settings.brightCursor)
    body.classList.toggle('a11y-screen-reader', settings.screenReaderMode)

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
  }, [settings])

  // Reading guide mouse tracking
  useEffect(() => {
    if (!settings.readingGuide) return

    const handleMouseMove = (e: MouseEvent) => {
      setReadingGuideY(e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [settings.readingGuide])

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetAll = useCallback(() => {
    setSettings(defaultSettings)
    localStorage.removeItem('accessibility-settings')
  }, [])

  // Toggle functions for exclusive modes
  const toggleContrast = (mode: 'high' | 'inverted' | 'grayscale' | 'blackWhite') => {
    setSettings(prev => ({
      ...prev,
      highContrast: mode === 'high' ? !prev.highContrast : false,
      invertedContrast: mode === 'inverted' ? !prev.invertedContrast : false,
      grayscale: mode === 'grayscale' ? !prev.grayscale : false,
      blackAndWhite: mode === 'blackWhite' ? !prev.blackAndWhite : false,
    }))
  }

  const toggleCursor = (mode: 'large' | 'bright') => {
    setSettings(prev => ({
      ...prev,
      largeCursor: mode === 'large' ? !prev.largeCursor : false,
      brightCursor: mode === 'bright' ? !prev.brightCursor : false,
    }))
  }

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="פתח תפריט נגישות"
        style={{
          position: 'fixed',
          top: '100px',
          right: '0',
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #177fab, #b586ff)',
          border: 'none',
          borderRadius: '12px 0 0 12px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          boxShadow: '-2px 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        <Accessibility size={24} />
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '320px',
            maxWidth: '100vw',
            height: '100vh',
            background: '#1a1a2e',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            zIndex: 9999,
            overflowY: 'auto',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: '#1a1a2e',
            zIndex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Accessibility size={22} style={{ color: '#b586ff' }} />
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>הגדרות נגישות</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="סגור תפריט נגישות"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '16px 20px' }}>
            {/* Reset Button */}
            <button
              onClick={resetAll}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(251, 113, 133, 0.15)',
                border: '1px solid rgba(251, 113, 133, 0.3)',
                borderRadius: '10px',
                color: '#fb7185',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                marginBottom: '20px',
              }}
            >
              <RotateCcw size={16} />
              איפוס הגדרות
            </button>

            {/* Contrast Section */}
            <SectionTitle icon={<Contrast size={18} />} title="תצוגה וניגודיות" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              <ToggleButton
                active={settings.highContrast}
                onClick={() => toggleContrast('high')}
                icon={<Sun size={18} />}
                label="ניגודיות גבוהה"
              />
              <ToggleButton
                active={settings.invertedContrast}
                onClick={() => toggleContrast('inverted')}
                icon={<Moon size={18} />}
                label="ניגודיות הפוכה"
              />
              <ToggleButton
                active={settings.grayscale}
                onClick={() => toggleContrast('grayscale')}
                icon={<Eye size={18} />}
                label="גווני אפור"
              />
              <ToggleButton
                active={settings.blackAndWhite}
                onClick={() => toggleContrast('blackWhite')}
                icon={<Contrast size={18} />}
                label="שחור לבן"
              />
            </div>

            {/* Text Section */}
            <SectionTitle icon={<Type size={18} />} title="טקסט וקריאות" />

            <SliderControl
              label="גודל טקסט"
              value={settings.fontSize}
              min={80}
              max={150}
              step={5}
              unit="%"
              onChange={(v) => updateSetting('fontSize', v)}
            />
            <SliderControl
              label="ריווח בין אותיות"
              value={settings.letterSpacing}
              min={0}
              max={10}
              step={1}
              unit="px"
              onChange={(v) => updateSetting('letterSpacing', v)}
            />
            <SliderControl
              label="ריווח בין מילים"
              value={settings.wordSpacing}
              min={0}
              max={20}
              step={2}
              unit="px"
              onChange={(v) => updateSetting('wordSpacing', v)}
            />
            <SliderControl
              label="גובה שורה"
              value={settings.lineHeight}
              min={100}
              max={200}
              step={10}
              unit="%"
              onChange={(v) => updateSetting('lineHeight', v)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              <ToggleButton
                active={settings.readableFont}
                onClick={() => updateSetting('readableFont', !settings.readableFont)}
                icon={<Type size={18} />}
                label="גופן קריא"
              />
              <ToggleButton
                active={settings.highlightLinks}
                onClick={() => updateSetting('highlightLinks', !settings.highlightLinks)}
                icon={<Link2 size={18} />}
                label="הדגשת קישורים"
              />
              <ToggleButton
                active={settings.highlightHeadings}
                onClick={() => updateSetting('highlightHeadings', !settings.highlightHeadings)}
                icon={<Type size={18} />}
                label="הדגשת כותרות"
              />
              <ToggleButton
                active={settings.stopAnimations}
                onClick={() => updateSetting('stopAnimations', !settings.stopAnimations)}
                icon={<EyeOff size={18} />}
                label="ביטול אנימציות"
              />
            </div>

            {/* Navigation Section */}
            <SectionTitle icon={<MousePointer2 size={18} />} title="ניווט וסמן" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              <ToggleButton
                active={settings.largeCursor}
                onClick={() => toggleCursor('large')}
                icon={<MousePointer2 size={18} />}
                label="סמן גדול"
              />
              <ToggleButton
                active={settings.brightCursor}
                onClick={() => toggleCursor('bright')}
                icon={<MousePointer2 size={18} />}
                label="סמן גדול בהיר"
              />
              <ToggleButton
                active={settings.readingGuide}
                onClick={() => updateSetting('readingGuide', !settings.readingGuide)}
                icon={<BookOpen size={18} />}
                label="מדריך קריאה"
              />
              <ToggleButton
                active={settings.hideImages}
                onClick={() => updateSetting('hideImages', !settings.hideImages)}
                icon={<EyeOff size={18} />}
                label="הסתרת תמונות"
              />
            </div>

            {/* Screen Reader Section */}
            <SectionTitle icon={<Volume2 size={18} />} title="קוראי מסך" />

            <ToggleButton
              active={settings.screenReaderMode}
              onClick={() => updateSetting('screenReaderMode', !settings.screenReaderMode)}
              icon={<Volume2 size={18} />}
              label="התאמה לקוראי מסך"
              fullWidth
            />

            {/* Footer */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
            }}>
              <a
                href="https://www.porsimkanaf.com/הצהרת-נגישות"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#b586ff', textDecoration: 'none' }}
              >
                הצהרת נגישות
              </a>
              <span style={{ margin: '0 8px' }}>|</span>
              <span>פורשים כנף © {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reading Guide Line */}
      {settings.readingGuide && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: readingGuideY - 2,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #b586ff, #177fab, transparent)',
            pointerEvents: 'none',
            zIndex: 9997,
            opacity: 0.8,
          }}
        />
      )}

      {/* Overlay when panel is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9998,
          }}
        />
      )}
    </>
  )
}

// Helper Components
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
      color: '#b586ff',
      fontSize: '0.85rem',
      fontWeight: 600,
    }}>
      {icon}
      {title}
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
  fullWidth,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  fullWidth?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '12px 10px',
        background: active ? 'rgba(181, 134, 255, 0.2)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? '#b586ff' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '10px',
        color: active ? '#b586ff' : 'rgba(255,255,255,0.7)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.75rem',
        fontWeight: 500,
        transition: 'all 0.2s',
        gridColumn: fullWidth ? '1 / -1' : undefined,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        fontSize: '0.85rem',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
        <span style={{ color: '#b586ff', fontWeight: 600 }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(to left, #b586ff ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 0%)`,
          appearance: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  )
}
