'use client'

import { formatCurrency } from '@/lib/format'

interface BalanceSummaryProps {
  totalBalance: string
  currency: string
  monthlyChange: {
    absolute: string
    percentage: number
  }
}

export function BalanceSummary({ totalBalance, currency, monthlyChange }: BalanceSummaryProps) {
  const changePercentage = monthlyChange.percentage
  const changeAbsolute = parseFloat(monthlyChange.absolute)
  const balance = parseFloat(totalBalance)
  const isPositive = balance >= 0

  return (
    <div className="glass-card" style={{ textAlign: 'center' }}>
      {/* Label with percentage */}
      <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
        יתרה נטו ({changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(0)}% שינוי)
      </div>

      {/* Main balance */}
      <div
        style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          margin: '5px 0',
          color: isPositive ? '#fff' : 'var(--expense)'
        }}
        dir="ltr"
      >
        {formatCurrency(totalBalance, currency)}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <div style={{
          flex: 1,
          padding: '16px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>שינוי מהחודש הקודם</span>
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              marginTop: '4px',
              display: 'block',
              color: changeAbsolute >= 0 ? 'var(--income)' : 'var(--expense)'
            }}
            dir="ltr"
          >
            {changeAbsolute >= 0 ? '+' : ''}{formatCurrency(changeAbsolute, currency)}
          </span>
        </div>

        <div style={{
          flex: 1,
          padding: '16px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>אחוז שינוי</span>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            marginTop: '4px',
            display: 'block',
            color: changePercentage >= 0 ? 'var(--income)' : 'var(--expense)'
          }}>
            {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default BalanceSummary
