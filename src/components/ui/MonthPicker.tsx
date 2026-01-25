'use client'

import { useState, useRef, useEffect } from 'react'

interface MonthPickerProps {
  month: number
  year: number
  onChange: (month: number, year: number) => void
}

const MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

export function MonthPicker({ month, year, onChange }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewYear, setViewYear] = useState(year)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setViewYear(year)
  }, [year])

  const selectMonth = (selectedMonth: number) => {
    if (viewYear > currentYear || (viewYear === currentYear && selectedMonth > currentMonth)) return
    onChange(selectedMonth, viewYear)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', marginBottom: '25px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: 'var(--card-bg)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '14px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          color: 'inherit'
        }}
      >
        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', display: 'block' }}>תקופה נבחרת ▼</span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '4px', display: 'block' }}>{MONTHS[month - 1]} {year}</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          background: 'var(--card-bg)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '16px',
          zIndex: 100,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {/* Year Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button
              onClick={() => viewYear < currentYear && setViewYear(viewYear + 1)}
              disabled={viewYear >= currentYear}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#fff', opacity: viewYear >= currentYear ? 0.3 : 1 }}
            >
              →
            </button>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{viewYear}</span>
            <button
              onClick={() => setViewYear(y => y - 1)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#fff' }}
            >
              ←
            </button>
          </div>

          {/* Month Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {MONTHS.map((monthName, index) => {
              const monthNum = index + 1
              const isSelected = monthNum === month && viewYear === year
              const isFuture = viewYear > currentYear || (viewYear === currentYear && monthNum > currentMonth)
              const isCurrent = monthNum === currentMonth && viewYear === currentYear

              return (
                <button
                  key={monthName}
                  onClick={() => selectMonth(monthNum)}
                  disabled={isFuture}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    background: isSelected ? 'var(--accent)' : isCurrent ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: isSelected ? 'var(--bg)' : isCurrent ? 'var(--accent)' : isFuture ? '#374151' : '#fff',
                    fontWeight: isSelected ? 700 : 400,
                    fontSize: '0.9rem',
                    cursor: isFuture ? 'not-allowed' : 'pointer'
                  }}
                >
                  {monthName}
                </button>
              )
            })}
          </div>

          {/* Current month button */}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => { onChange(currentMonth, currentYear); setIsOpen(false) }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              החודש הנוכחי
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MonthPicker
