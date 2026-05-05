'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/utils/format'
import {
  Plus, Minus, Pencil, Trash2, LogOut,
  Home, Utensils, Bus, PartyPopper, ShoppingBag, Gift, PiggyBank, Package,
  Banknote, CreditCard, Coins, FileText, Heart, GraduationCap, type LucideIcon
} from 'lucide-react'

// Category icon mapping
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'דיור': Home,
  'מזון': Utensils,
  'תחבורה': Bus,
  'בילויים': PartyPopper,
  'קניות': ShoppingBag,
  'מתנות': Gift,
  'חסכון': PiggyBank,
  'חשבונות': FileText,
  'בריאות': Heart,
  'לימודים': GraduationCap,
  'אחר': Package,
}

const getCategoryIconComponent = (categoryName?: string): LucideIcon => {
  return CATEGORY_ICONS[categoryName || ''] || Package
}

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
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

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
        setError(null)
      }
    } catch (e) {
      console.error(e)
      setError('שגיאה בטעינת הנתונים. נסה לרענן את הדף.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    await logout()
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

  // Get default date for modals - today's date if in selected month, otherwise first day of selected month
  const getSelectedMonthDate = () => {
    const today = new Date()
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth() + 1

    // If viewing current month, use today's date
    if (selectedYear === todayYear && selectedMonth === todayMonth) {
      return today.toISOString().split('T')[0]
    }
    // Otherwise use the first day of the selected month
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
  }

  // Get category icon component
  const CategoryIcon = ({ name, size = 22 }: { name?: string; size?: number }) => {
    const Icon = getCategoryIconComponent(name)
    return <Icon size={size} strokeWidth={1.5} />
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
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 2px 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>תזרים</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.8rem' }}>הכנסות והוצאות</p>
      </div>

      {/* Month Selector */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          style={{
            width: '100%',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '12px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            color: 'inherit'
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{displayMonth} {selectedYear}</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginRight: '6px' }}>▼</span>
        </button>

        {showMonthPicker && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px',
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                style={{ background: 'var(--hover-bg)', border: 'none', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
              >
                →
              </button>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedYear}</span>
              <button
                onClick={() => setSelectedYear(y => y + 1)}
                style={{ background: 'var(--hover-bg)', border: 'none', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
              >
                ←
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {monthNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => handleMonthSelect(index + 1, selectedYear)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '8px',
                    background: selectedMonth === index + 1 ? 'var(--accent)' : 'var(--hover-bg)',
                    border: 'none',
                    color: selectedMonth === index + 1 ? '#fff' : 'var(--text-main)',
                    fontWeight: selectedMonth === index + 1 ? 600 : 400,
                    fontSize: '0.8rem'
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
      <div className="card" style={{ marginBottom: '12px', textAlign: 'center' }}>
        {isLoading ? (
          <div style={{ padding: '30px 0', color: 'var(--text-dim)' }}>טוען...</div>
        ) : (
          <>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              יתרה נטו · {percentage}% נותר
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, margin: '4px 0', color: balance >= 0 ? 'var(--text-main)' : 'var(--expense)', letterSpacing: '-0.5px' }}>
              {formatCurrency(balance)}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <div style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--hover-bg)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>הכנסות</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px', display: 'block', color: 'var(--income)' }}>
                  {formatCurrency(totalIncome)}
                </span>
              </div>
              <div style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--hover-bg)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>הוצאות</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px', display: 'block', color: 'var(--expense)' }}>
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => !isDemo && setShowIncomeModal(true)}
          disabled={isDemo}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '10px',
            background: isDemo ? 'var(--hover-bg)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${isDemo ? 'var(--border)' : 'rgba(34, 197, 94, 0.25)'}`,
            color: isDemo ? 'var(--text-dim)' : 'var(--income)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: isDemo ? 'not-allowed' : 'pointer',
            opacity: isDemo ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Plus size={16} strokeWidth={2.5} style={{ marginLeft: '4px' }} />
          הכנסה
        </button>
        <button
          onClick={() => !isDemo && setShowExpenseModal(true)}
          disabled={isDemo}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '10px',
            background: isDemo ? 'var(--hover-bg)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${isDemo ? 'var(--border)' : 'rgba(244, 63, 94, 0.25)'}`,
            color: isDemo ? 'var(--text-dim)' : 'var(--expense)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: isDemo ? 'not-allowed' : 'pointer',
            opacity: isDemo ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Minus size={16} strokeWidth={2.5} style={{ marginLeft: '4px' }} />
          הוצאה
        </button>
      </div>

      {isDemo && (
        <div style={{
          textAlign: 'center',
          marginBottom: '16px',
          padding: '10px',
          background: 'var(--hover-bg)',
          borderRadius: '8px',
        }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            להוספת הוצאות והכנסות — התחברו עם Google
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--expense)' }}>{error}</p>
        </div>
      )}

      {/* Transaction History */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dim)' }}>
          פעולות אחרונות
        </h3>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
            אין פעולות בחודש זה
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(showAll ? transactions : transactions.slice(0, 10)).map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'var(--hover-bg)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: t.type === 'INCOME' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: t.type === 'INCOME' ? 'var(--income)' : 'var(--expense)'
                  }}>
                    {t.type === 'INCOME' ? <Coins size={18} strokeWidth={1.5} /> : <CategoryIcon name={t.category?.name} size={18} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {t.type === 'INCOME' ? t.source : t.category?.name || 'אחר'}
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                      {new Date(t.date).toLocaleDateString('he-IL')}
                      {t.description && ` · ${t.description}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: t.type === 'INCOME' ? 'var(--income)' : 'var(--expense)'
                  }}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                  {!isDemo && (
                    <>
                      <button
                        onClick={() => setEditingTransaction(t)}
                        style={{
                          background: 'var(--hover-bg)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 6px',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          display: 'flex',
                        }}
                      >
                        <Pencil size={13} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        style={{
                          background: 'var(--hover-bg)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 6px',
                          color: 'var(--expense)',
                          cursor: 'pointer',
                          display: 'flex',
                        }}
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {transactions.length > 10 && (
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '8px',
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--accent)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {showAll ? 'הצג פחות' : `הצג את כל הפעולות (${transactions.length})`}
              </button>
            )}
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
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`)
        }
        return r.json()
      })
      .then(d => {
        if (d.categories) {
          setCategories(d.categories)
        } else {
          console.error('No categories in response:', d)
        }
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err)
        setError('שגיאה בטעינת קטגוריות')
      })
  }, [])

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
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('שגיאת רשת - בדוק את החיבור לאינטרנט')
      } else {
        setError('שגיאה בחיבור לשרת - נסה שוב')
      }
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
          <button onClick={onClose} style={{ background: 'var(--active-bg)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'var(--text-main)', fontSize: '1.2rem' }}>×</button>
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
                  background: categoryId === cat.id ? 'rgba(13, 148, 136, 0.15)' : 'var(--hover-bg)',
                  border: categoryId === cat.id ? '2px solid var(--accent)' : '2px solid transparent',
                  textAlign: 'center',
                  color: categoryId === cat.id ? 'var(--accent)' : 'var(--text-dim)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {(() => { const Icon = getCategoryIconComponent(cat.name); return <Icon size={24} strokeWidth={1.5} /> })()}
                <span style={{ fontSize: '0.75rem' }}>{cat.name}</span>
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
                background: paymentMethod === 'CASH' ? 'rgba(34, 197, 94, 0.15)' : 'var(--hover-bg)',
                border: paymentMethod === 'CASH' ? '2px solid var(--income)' : '2px solid transparent',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Banknote size={20} strokeWidth={1.5} />
              מזומן
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: paymentMethod === 'CARD' ? 'rgba(13, 148, 136, 0.15)' : 'var(--hover-bg)',
                border: paymentMethod === 'CARD' ? '2px solid var(--accent)' : '2px solid transparent',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CreditCard size={20} strokeWidth={1.5} />
              כרטיס
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
            color: 'var(--text-main)',
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
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('שגיאת רשת - בדוק את החיבור לאינטרנט')
      } else {
        setError('שגיאה בחיבור לשרת - נסה שוב')
      }
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
          <button onClick={onClose} style={{ background: 'var(--active-bg)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'var(--text-main)', fontSize: '1.2rem' }}>×</button>
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
          <button onClick={onClose} style={{ background: 'var(--active-bg)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'var(--text-main)', fontSize: '1.2rem' }}>×</button>
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
                    background: categoryId === cat.id ? 'rgba(13, 148, 136, 0.15)' : 'var(--hover-bg)',
                    border: categoryId === cat.id ? '2px solid var(--accent)' : '2px solid transparent',
                    textAlign: 'center',
                    color: categoryId === cat.id ? 'var(--accent)' : 'var(--text-dim)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {(() => { const Icon = getCategoryIconComponent(cat.name); return <Icon size={24} strokeWidth={1.5} /> })()}
                  <span style={{ fontSize: '0.75rem' }}>{cat.name}</span>
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
                  background: paymentMethod === 'CASH' ? 'rgba(34, 197, 94, 0.15)' : 'var(--hover-bg)',
                  border: paymentMethod === 'CASH' ? '2px solid var(--income)' : '2px solid transparent',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Banknote size={20} strokeWidth={1.5} />
                מזומן
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: paymentMethod === 'CARD' ? 'rgba(13, 148, 136, 0.15)' : 'var(--hover-bg)',
                  border: paymentMethod === 'CARD' ? '2px solid var(--accent)' : '2px solid transparent',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CreditCard size={20} strokeWidth={1.5} />
                כרטיס
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
