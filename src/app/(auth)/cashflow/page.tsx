'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/utils/format'

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  category?: { id: string; name: string }
  categoryId?: string
  paymentMethod?: 'CASH' | 'CARD'
  source?: string
  description?: string
  date: string
}

export default function HomePage() {
  const { logout, isDemo } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1) // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const balance = totalIncome - totalExpenses
  const percentage = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/transactions?month=${selectedMonth}&year=${selectedYear}`)
      const data = await res.json()
      if (data.transactions) {
        setTransactions(data.transactions)
        let inc = 0, exp = 0
        data.transactions.forEach((t: Transaction) => {
          if (t.type === 'INCOME') inc += t.amount
          else exp += t.amount
        })
        setTotalIncome(inc)
        setTotalExpenses(exp)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  // Get month name in Hebrew
  const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
  const displayMonth = monthNames[selectedMonth - 1]

  const handleMonthSelect = (month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
    setShowMonthPicker(false)
    setIsLoading(true)
  }

  // Get date for selected month (for modals)
  const getSelectedMonthDate = () => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-15`
  }

  // Get category icon
  const getCategoryIcon = (categoryName?: string) => {
    const icons: Record<string, string> = {
      'דיור': '🏠', 'מזון': '🍽️', 'תחבורה': '🚌', 'בילויים': '🎉',
      'קניות': '🛍️', 'מתנות': '🎁', 'חסכון': '💰', 'אחר': '📦'
    }
    return icons[categoryName || ''] || '📦'
  }

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('האם למחוק את הפעולה?')) return
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      }
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

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
            👀 מצב צפייה בלבד - התחבר עם Google כדי לנהל את הכספים שלך
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
        <button
          onClick={handleLogout}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-dim)',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.9rem'
          }}
        >
          יציאה
        </button>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '2px' }}>פורשים כנף - חינוך פיננסי</p>
        <h1 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px' }}>תזרים</h1>
        {isDemo && (
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
            מצב צפייה • Demo Mode
          </span>
        )}
      </div>

      {/* Month Selector - Clickable */}
      <div style={{ position: 'relative', marginBottom: '25px' }}>
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
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
          <span style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '4px', display: 'block' }}>{displayMonth} {selectedYear}</span>
        </button>

        {/* Month Dropdown */}
        {showMonthPicker && (
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
                onClick={() => setSelectedYear(y => y + 1)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#fff' }}
              >
                →
              </button>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedYear}</span>
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#fff' }}
              >
                ←
              </button>
            </div>

            {/* Month Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {monthNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => handleMonthSelect(index + 1, selectedYear)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    background: selectedMonth === index + 1 ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: selectedMonth === index + 1 ? 'var(--bg)' : '#fff',
                    fontWeight: selectedMonth === index + 1 ? 700 : 400,
                    fontSize: '0.9rem'
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Balance Card */}
      <div className="glass-card" style={{ marginBottom: '20px', textAlign: 'center' }}>
        {isLoading ? (
          <div style={{ padding: '40px 0', color: 'var(--text-dim)' }}>טוען...</div>
        ) : (
          <>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              יתרה נטו ({percentage}% נותר)
            </div>
            <div style={{ fontSize: '2.8rem', fontWeight: 800, margin: '5px 0', color: balance >= 0 ? '#fff' : 'var(--expense)' }}>
              {formatCurrency(balance)}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <div style={{
                flex: 1,
                padding: '16px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>הכנסות</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', display: 'block', color: 'var(--income)' }}>
                  {formatCurrency(totalIncome)}
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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>הוצאות</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', display: 'block', color: 'var(--expense)' }}>
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => !isDemo && setShowExpenseModal(true)}
          disabled={isDemo}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '16px',
            background: isDemo ? 'rgba(255, 255, 255, 0.05)' : 'rgba(251, 113, 133, 0.15)',
            border: `1px solid ${isDemo ? 'rgba(255,255,255,0.1)' : 'var(--expense)'}`,
            color: isDemo ? 'var(--text-dim)' : 'var(--expense)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isDemo ? 'not-allowed' : 'pointer',
            opacity: isDemo ? 0.5 : 1
          }}
        >
          ➖ הוצאה
        </button>
        <button
          onClick={() => !isDemo && setShowIncomeModal(true)}
          disabled={isDemo}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '16px',
            background: isDemo ? 'rgba(255, 255, 255, 0.05)' : 'rgba(74, 222, 128, 0.15)',
            border: `1px solid ${isDemo ? 'rgba(255,255,255,0.1)' : 'var(--income)'}`,
            color: isDemo ? 'var(--text-dim)' : 'var(--income)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isDemo ? 'not-allowed' : 'pointer',
            opacity: isDemo ? 0.5 : 1
          }}
        >
          ➕ הכנסה
        </button>
      </div>

      {/* Demo mode notice for disabled buttons */}
      {isDemo && (
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '12px',
          background: 'rgba(56, 189, 248, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.3)'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent)' }}>
            💡 להוספת הוצאות והכנסות, התחבר עם Google
          </p>
        </div>
      )}

      {/* Transaction History */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dim)' }}>
          פעולות אחרונות
        </h3>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
            אין פעולות בחודש זה
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {transactions.slice(0, 10).map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.3rem' }}>
                    {t.type === 'INCOME' ? '💰' : getCategoryIcon(t.category?.name)}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {t.type === 'INCOME' ? t.source : t.category?.name || 'אחר'}
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {new Date(t.date).toLocaleDateString('he-IL')}
                      {t.description && ` • ${t.description}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: t.type === 'INCOME' ? 'var(--income)' : 'var(--expense)'
                  }}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                  {!isDemo && (
                    <>
                      <button
                        onClick={() => setEditingTransaction(t)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.2)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          color: 'var(--accent)',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        style={{
                          background: 'rgba(251, 113, 133, 0.2)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          color: 'var(--expense)',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => { setShowExpenseModal(false); fetchData(); }}
          defaultDate={getSelectedMonthDate()}
        />
      )}

      {/* Income Modal */}
      {showIncomeModal && (
        <IncomeModal
          onClose={() => setShowIncomeModal(false)}
          onSuccess={() => { setShowIncomeModal(false); fetchData(); }}
          defaultDate={getSelectedMonthDate()}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => { setEditingTransaction(null); fetchData(); }}
        />
      )}
    </div>
  )
}

// Expense Modal Component
function ExpenseModal({ onClose, onSuccess, defaultDate }: { onClose: () => void; onSuccess: () => void; defaultDate: string }) {
  const [amount, setAmount] = useState('')
  const [displayAmount, setDisplayAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedCategoryName, setSelectedCategoryName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CARD')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [categories, setCategories] = useState<{id: string; name: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => d.categories && setCategories(d.categories))
      .catch(console.error)
  }, [])

  const categoryIcons: Record<string, string> = {
    'דיור': '🏠', 'מזון': '🍽️', 'תחבורה': '🚌', 'בילויים': '🎉',
    'קניות': '🛍️', 'מתנות': '🎁', 'חסכון': '💰', 'אחר': '📦'
  }

  const categoryExamples: Record<string, string> = {
    'דיור': 'שכירות, ארנונה, חשמל',
    'מזון': 'סופר, ארוחת צהריים, קפה',
    'תחבורה': 'רב-קו, מונית, דלק',
    'בילויים': 'קולנוע, מסעדה, בר',
    'קניות': 'בגדים, נעליים, אלקטרוניקה',
    'מתנות': 'יום הולדת, חג, תרומה',
    'חסכון': 'קופת גמל, פיקדון',
    'אחר': 'הוצאה כללית'
  }

  // Format amount with commas
  const handleAmountChange = (value: string) => {
    const digits = value.replace(/[^\d]/g, '')
    setAmount(digits)
    if (digits) {
      setDisplayAmount(Number(digits).toLocaleString('he-IL'))
    } else {
      setDisplayAmount('')
    }
  }

  const handleCategorySelect = (id: string, name: string) => {
    setCategoryId(id)
    setSelectedCategoryName(name)
  }

  const handleSubmit = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('יש להזין סכום')
      return
    }
    if (!categoryId) {
      setError('יש לבחור קטגוריה')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EXPENSE',
          amount: parseInt(amount),
          categoryId,
          paymentMethod,
          date,
          description: description || undefined
        })
      })

      const data = await res.json()
      if (res.ok) {
        onSuccess()
      } else {
        console.error('API error:', data)
        setError(data.details?.formErrors?.[0] || data.error || 'שגיאה בשמירה')
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('שגיאה בחיבור לשרת')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 150
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '100px',
        width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>הוסף הוצאה</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#fff', fontSize: '1.2rem' }}>×</button>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>סכום</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--expense)', fontSize: '1.2rem', fontWeight: 700 }}>₪</span>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              style={{ paddingRight: '40px', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}
            />
          </div>
        </div>

        {/* Categories */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>קטגוריה</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id, cat.name)}
                style={{
                  padding: '12px 8px',
                  borderRadius: '16px',
                  background: categoryId === cat.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: categoryId === cat.id ? '2px solid var(--accent)' : '2px solid transparent',
                  textAlign: 'center',
                  color: '#fff'
                }}
              >
                <span style={{ display: 'block', fontSize: '1.5rem', marginBottom: '4px' }}>{categoryIcons[cat.name] || '📦'}</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)' }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>אמצעי תשלום</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: paymentMethod === 'CASH' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.03)',
                border: paymentMethod === 'CASH' ? '2px solid var(--income)' : '2px solid transparent',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              💵 מזומן
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: paymentMethod === 'CARD' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                border: paymentMethod === 'CARD' ? '2px solid var(--accent)' : '2px solid transparent',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              💳 כרטיס
            </button>
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>תאריך</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ textAlign: 'center' }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>תיאור (אופציונלי)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={selectedCategoryName ? `למשל: ${categoryExamples[selectedCategoryName] || 'הוצאה כללית'}` : 'בחר קטגוריה קודם...'}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--expense)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            background: 'var(--expense)',
            border: 'none',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 600
          }}
        >
          {isSubmitting ? 'שומר...' : 'הוסף הוצאה'}
        </button>
      </div>
    </div>
  )
}

// Income Modal Component
function IncomeModal({ onClose, onSuccess, defaultDate }: { onClose: () => void; onSuccess: () => void; defaultDate: string }) {
  const [amount, setAmount] = useState('')
  const [displayAmount, setDisplayAmount] = useState('')
  const [source, setSource] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Format amount with commas
  const handleAmountChange = (value: string) => {
    const digits = value.replace(/[^\d]/g, '')
    setAmount(digits)
    if (digits) {
      setDisplayAmount(Number(digits).toLocaleString('he-IL'))
    } else {
      setDisplayAmount('')
    }
  }

  const handleSubmit = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('יש להזין סכום')
      return
    }
    if (!source.trim()) {
      setError('יש להזין מקור הכנסה')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'INCOME',
          amount: parseInt(amount),
          source,
          date,
          description: description || undefined
        })
      })

      const data = await res.json()
      if (res.ok) {
        onSuccess()
      } else {
        console.error('API error:', data)
        setError(data.details?.formErrors?.[0] || data.error || 'שגיאה בשמירה')
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('שגיאה בחיבור לשרת')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 150
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '100px',
        width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--income)' }}>הוסף הכנסה</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#fff', fontSize: '1.2rem' }}>×</button>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>סכום</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--income)', fontSize: '1.2rem', fontWeight: 700 }}>₪</span>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              style={{ paddingRight: '40px', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}
            />
          </div>
        </div>

        {/* Source */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>מקור הכנסה</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="למשל: משכורת, מתנה, פרילנס..."
          />
        </div>

        {/* Date */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>תאריך</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ textAlign: 'center' }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>תיאור (אופציונלי)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="למשל: משכורת ינואר"
          />
        </div>

        {error && (
          <div style={{ color: 'var(--expense)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            background: 'var(--income)',
            border: 'none',
            color: 'var(--bg)',
            fontSize: '1.1rem',
            fontWeight: 600
          }}
        >
          {isSubmitting ? 'שומר...' : 'הוסף הכנסה'}
        </button>
      </div>
    </div>
  )
}

// Edit Transaction Modal Component
function EditTransactionModal({
  transaction,
  onClose,
  onSuccess
}: {
  transaction: Transaction
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState(transaction.amount.toString())
  const [displayAmount, setDisplayAmount] = useState(transaction.amount.toLocaleString('he-IL'))
  const [categoryId, setCategoryId] = useState(transaction.category?.id || '')
  const [selectedCategoryName, setSelectedCategoryName] = useState(transaction.category?.name || '')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>(transaction.paymentMethod || 'CARD')
  const [source, setSource] = useState(transaction.source || '')
  const [description, setDescription] = useState(transaction.description || '')
  const [date, setDate] = useState(transaction.date.split('T')[0])
  const [categories, setCategories] = useState<{id: string; name: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isExpense = transaction.type === 'EXPENSE'

  useEffect(() => {
    if (isExpense) {
      fetch('/api/categories')
        .then(r => r.json())
        .then(d => d.categories && setCategories(d.categories))
        .catch(console.error)
    }
  }, [isExpense])

  const categoryIcons: Record<string, string> = {
    'אוכל': '🍽️', 'תחבורה': '🚌', 'בילויים': '🎉', 'קניות': '🛍️',
    'חשבונות': '📄', 'בריאות': '💊', 'לימודים': '📚', 'אחר': '📦'
  }

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/[^\d]/g, '')
    setAmount(digits)
    if (digits) {
      setDisplayAmount(Number(digits).toLocaleString('he-IL'))
    } else {
      setDisplayAmount('')
    }
  }

  const handleSubmit = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('יש להזין סכום')
      return
    }
    if (isExpense && !categoryId) {
      setError('יש לבחור קטגוריה')
      return
    }
    if (!isExpense && !source.trim()) {
      setError('יש להזין מקור הכנסה')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const body: Record<string, unknown> = {
        amount: parseInt(amount),
        date,
        description: description || undefined
      }

      if (isExpense) {
        body.categoryId = categoryId
        body.paymentMethod = paymentMethod
      } else {
        body.source = source
      }

      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (res.ok) {
        onSuccess()
      } else {
        console.error('API error:', data)
        setError(data.details?.formErrors?.[0] || data.error || 'שגיאה בשמירה')
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('שגיאה בחיבור לשרת')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 150
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '100px',
        width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: isExpense ? 'var(--expense)' : 'var(--income)' }}>
            עריכת {isExpense ? 'הוצאה' : 'הכנסה'}
          </h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#fff', fontSize: '1.2rem' }}>×</button>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>סכום</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: isExpense ? 'var(--expense)' : 'var(--income)', fontSize: '1.2rem', fontWeight: 700 }}>₪</span>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              style={{ paddingRight: '40px', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}
            />
          </div>
        </div>

        {/* Categories (for expenses) */}
        {isExpense && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>קטגוריה</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setCategoryId(cat.id); setSelectedCategoryName(cat.name); }}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '16px',
                    background: categoryId === cat.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: categoryId === cat.id ? '2px solid var(--accent)' : '2px solid transparent',
                    textAlign: 'center',
                    color: '#fff'
                  }}
                >
                  <span style={{ display: 'block', fontSize: '1.5rem', marginBottom: '4px' }}>{categoryIcons[cat.name] || '📦'}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)' }}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment Method (for expenses) */}
        {isExpense && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>אמצעי תשלום</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: paymentMethod === 'CASH' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: paymentMethod === 'CASH' ? '2px solid var(--income)' : '2px solid transparent',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                💵 מזומן
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: paymentMethod === 'CARD' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: paymentMethod === 'CARD' ? '2px solid var(--accent)' : '2px solid transparent',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                💳 כרטיס
              </button>
            </div>
          </div>
        )}

        {/* Source (for income) */}
        {!isExpense && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>מקור הכנסה</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="למשל: משכורת, מתנה, פרילנס..."
            />
          </div>
        )}

        {/* Date */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>תאריך</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ textAlign: 'center' }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>תיאור (אופציונלי)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="תיאור קצר..."
          />
        </div>

        {error && (
          <div style={{ color: 'var(--expense)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            background: isExpense ? 'var(--expense)' : 'var(--income)',
            border: 'none',
            color: isExpense ? '#fff' : 'var(--bg)',
            fontSize: '1.1rem',
            fontWeight: 600
          }}
        >
          {isSubmitting ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>
    </div>
  )
}
