'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useDemoSession } from '@/hooks/useDemoSession'

interface CashflowData {
  totalIncome: number
  totalExpenses: number
  netBalance: number
}

interface BalanceData {
  totalBalance: number
}

export default function HomePage() {
  const { data: session } = useSession()
  const { demoUser } = useDemoSession()
  const isDemo = !session?.user && !!demoUser

  const [cashflowData, setCashflowData] = useState<CashflowData | null>(null)
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const fetchData = useCallback(async () => {
    try {
      // Fetch cashflow data
      const cashflowRes = await fetch(`/api/transactions?month=${currentMonth}&year=${currentYear}`)
      if (cashflowRes.ok) {
        const cashflowJson = await cashflowRes.json()
        if (cashflowJson.transactions) {
          let totalIncome = 0
          let totalExpenses = 0
          cashflowJson.transactions.forEach((t: { type: string; amount: number }) => {
            if (t.type === 'INCOME') totalIncome += t.amount
            else totalExpenses += t.amount
          })
          setCashflowData({
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
          })
        }
      }

      // Fetch balance data
      const balanceRes = await fetch(`/api/values?month=${currentMonth}&year=${currentYear}`)
      if (balanceRes.ok) {
        const balanceJson = await balanceRes.json()
        setBalanceData({
          totalBalance: parseFloat(balanceJson.totalBalance || '0'),
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth, currentYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto', minHeight: '100vh' }}>
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
            מצב צפייה בלבד - התחבר עם Google כדי לנהל את הכספים שלך
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <img src="/logo-6.png" alt="פורשים כנף" style={{ width: '48px', height: '48px', marginBottom: '8px', borderRadius: '12px' }} />
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '2px' }}>פורשים כנף - חינוך פיננסי</p>
        <h1 style={{ margin: '4px 0 0 0', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>מנכ״לים</h1>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
          {monthNames[currentMonth - 1]} {currentYear}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-dim)' }}>טוען...</p>
          </div>
        </div>
      )}

      {/* Cards */}
      {!isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Cashflow Card */}
          <Link href="/cashflow" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card" style={{
              padding: '24px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.5rem' }}>💸</span>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>תזרים חודשי</h2>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    כמה נכנס ויצא החודש
                  </p>
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>←</span>
              </div>

              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: cashflowData && cashflowData.netBalance >= 0 ? 'var(--income)' : 'var(--expense)',
                marginBottom: '16px'
              }}>
                {cashflowData ? formatCurrency(cashflowData.netBalance) : '₪0'}
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>הכנסות</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--income)' }}>
                    {cashflowData ? formatCurrency(cashflowData.totalIncome) : '₪0'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>הוצאות</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--expense)' }}>
                    {cashflowData ? formatCurrency(cashflowData.totalExpenses) : '₪0'}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Balance Card */}
          <Link href="/balance" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card" style={{
              padding: '24px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚖️</span>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>מאזן נכסים</h2>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    כמה שווה הכל ביחד
                  </p>
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>←</span>
              </div>

              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--accent)',
              }}>
                {balanceData ? formatCurrency(balanceData.totalBalance) : '₪0'}
              </div>

              <p style={{ margin: '12px 0 0 0', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                סך כל הנכסים שלך
              </p>
            </div>
          </Link>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Link href="/dashboard" style={{ flex: 1, textDecoration: 'none' }}>
              <div className="glass-card" style={{
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '1.3rem', display: 'block', marginBottom: '4px' }}>📊</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>דשבורד</span>
              </div>
            </Link>
            <Link href="/settings" style={{ flex: 1, textDecoration: 'none' }}>
              <div className="glass-card" style={{
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '1.3rem', display: 'block', marginBottom: '4px' }}>⚙️</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>הגדרות</span>
              </div>
            </Link>
          </div>

          {/* About Section */}
          <div className="glass-card" style={{ marginTop: '16px', padding: '20px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px 0', color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              <strong style={{ color: '#fff' }}>מנכ״לים</strong> - כלי פשוט לניהול הכספים האישיים.
              <br />
              עקוב אחרי ההוצאות וההכנסות, ונהל את כל הנכסים שלך במקום אחד.
            </p>
            <a
              href="https://www.porsimkanaf.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid var(--accent)',
                borderRadius: '20px',
                color: 'var(--accent)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              לאתר פורשים כנף →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
