'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Activity,
  TrendingUp,
  Clock,
  Mail,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ShieldAlert,
  Wallet,
  BarChart3,
  Lock,
  Eye,
  EyeOff,
  X,
  Download,
  PiggyBank,
  CreditCard,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const ADMIN_EMAIL = 'spread.a.wing@gmail.com'

interface UserStats {
  total: number
  online: number
  today: number
  thisWeek: number
  thisMonth: number
}

interface ActivityStats {
  transactionsToday: number
  transactionsThisMonth: number
  assetsToday: number
  assetsThisMonth: number
  totalTransactions: number
  totalAssets: number
  totalMonthlyValues: number
}

interface UserInfo {
  id: string
  email: string
  name: string | null
  image: string | null
  createdAt: string
  lastActiveAt: string | null
  transactions: number
  assetClasses: number
  monthlyValues: number
}

interface RegistrationDay {
  date: string
  count: number
}

interface CategoryAverage {
  name: string
  total: number
  count: number
  avgPerUser: number
}

interface MonthlyTrend {
  year: number
  month: number
  type: string
  total: number
  count: number
}

interface Aggregates {
  avgIncomePerUser: number
  avgExpensePerUser: number
  avgNetWorth: number
  totalIncome: number
  totalExpenses: number
  activeUsersCount: number
  usersWithAssets: number
  categoryAverages: CategoryAverage[]
  monthlyTrends: MonthlyTrend[]
}

interface AdminStats {
  users: UserStats
  activity: ActivityStats
  financials: { totalManagedValue: string }
  userList: UserInfo[]
  registrationsByDay: RegistrationDay[]
  aggregates: Aggregates
}

interface UserDetails {
  user: {
    id: string
    email: string
    name: string | null
    createdAt: string
    lastActiveAt: string | null
  }
  summary: {
    totalIncome: number
    totalExpense: number
    netCashflow: number
    totalAssetValue: number
    transactionCount: number
    assetCount: number
  }
  monthlySummary: {
    month: string
    income: number
    expense: number
    net: number
    transactionCount: number
  }[]
  assets: {
    name: string
    class: string
    instrument: string
    provider: string
    value: number
    currency: string
  }[]
  categorySummary: {
    name: string
    total: number
    count: number
  }[]
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Password protection
  const [isVerified, setIsVerified] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // User details modal
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [showAggregates, setShowAggregates] = useState(true)

  useEffect(() => {
    // Check if already verified in this session
    const verified = sessionStorage.getItem('admin_verified')
    if (verified === 'true') {
      setIsVerified(true)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      router.push('/')
      return
    }

    if (isVerified) {
      fetchStats()
    }
  }, [session, status, router, isVerified])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserDetails = async (userId: string) => {
    try {
      setIsLoadingUser(true)
      const res = await fetch(`/api/admin/user/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch user details')
      const data = await res.json()
      setSelectedUser(data)
    } catch (e) {
      console.error('Error fetching user:', e)
    } finally {
      setIsLoadingUser(false)
    }
  }

  const exportToExcel = () => {
    if (!stats) return

    // Create CSV content
    const headers = ['שם', 'אימייל', 'תאריך הצטרפות', 'כניסה אחרונה', 'עסקאות', 'נכסים']
    const rows = stats.userList.map(u => [
      u.name || 'ללא שם',
      u.email,
      formatDate(u.createdAt),
      u.lastActiveAt ? formatDate(u.lastActiveAt) : 'לא פעיל',
      u.transactions.toString(),
      u.assetClasses.toString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Add BOM for Hebrew support
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const verifyPassword = async () => {
    if (!password.trim()) {
      setPasswordError('נא להזין סיסמה')
      return
    }

    setIsVerifying(true)
    setPasswordError('')

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (data.verified) {
        sessionStorage.setItem('admin_verified', 'true')
        setIsVerified(true)
      } else {
        setPasswordError(data.error || 'סיסמה שגויה')
      }
    } catch {
      setPasswordError('שגיאה באימות')
    } finally {
      setIsVerifying(false)
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  if (session?.user?.email !== ADMIN_EMAIL) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <ShieldAlert size={48} style={{ color: 'var(--expense)' }} />
        <p style={{ color: 'var(--text-dim)' }}>אין גישה לדף זה</p>
      </div>
    )
  }

  // Password protection screen
  if (!isVerified) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div className="glass-card" style={{
          padding: '32px',
          maxWidth: '320px',
          width: '90%',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Lock size={28} style={{ color: 'var(--accent)' }} />
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
            אזור מוגן
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '24px' }}>
            נא להזין סיסמת אדמין
          </p>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
              placeholder="סיסמה"
              style={{
                width: '100%',
                padding: '14px 44px 14px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: passwordError ? '1px solid var(--expense)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                textAlign: 'right',
                direction: 'ltr',
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {passwordError && (
            <p style={{ color: 'var(--expense)', fontSize: '0.85rem', marginBottom: '16px' }}>
              {passwordError}
            </p>
          )}

          <button
            onClick={verifyPassword}
            disabled={isVerifying}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '12px',
              color: '#000',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isVerifying ? 'not-allowed' : 'pointer',
              opacity: isVerifying ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isVerifying ? (
              <Loader2 size={18} className="spin" />
            ) : (
              'כניסה'
            )}
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--expense)' }}>
        שגיאה: {error}
      </div>
    )
  }

  if (!stats) return null

  const formatNumber = (num: number) => num.toLocaleString('he-IL')
  const formatCurrency = (num: string) => {
    const value = parseFloat(num)
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return formatNumber(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  const formatTime = (date: string | null) => {
    if (!date) return 'לא פעיל'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'עכשיו'
    if (diffMins < 60) return `לפני ${diffMins} דק׳`
    if (diffMins < 1440) return `לפני ${Math.floor(diffMins / 60)} שע׳`
    return formatDate(date)
  }

  const isOnline = (lastActiveAt: string | null) => {
    if (!lastActiveAt) return false
    const d = new Date(lastActiveAt)
    const now = new Date()
    return now.getTime() - d.getTime() < 5 * 60 * 1000 // 5 minutes
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ShieldAlert size={28} />
        דשבורד ניהול
      </h1>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          icon={<Users size={20} />}
          label="משתמשים"
          value={formatNumber(stats.users.total)}
          subValue={`${stats.users.online} אונליין`}
          color="var(--accent)"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="פעילות היום"
          value={formatNumber(stats.activity.transactionsToday + stats.activity.assetsToday)}
          subValue={`${stats.activity.transactionsThisMonth} החודש`}
          color="var(--income)"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="הצטרפו החודש"
          value={formatNumber(stats.users.thisMonth)}
          subValue={`${stats.users.today} היום`}
          color="#f59e0b"
        />
        <StatCard
          icon={<Wallet size={20} />}
          label="סה״כ מנוהל"
          value={`${formatCurrency(stats.financials.totalManagedValue)}`}
          subValue="ש״ח"
          color="#a78bfa"
        />
      </div>

      {/* Activity Summary */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} />
          סיכום פעילות
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
          <MiniStat label="עסקאות היום" value={stats.activity.transactionsToday} />
          <MiniStat label="עסקאות החודש" value={stats.activity.transactionsThisMonth} />
          <MiniStat label="נכסים היום" value={stats.activity.assetsToday} />
          <MiniStat label="נכסים החודש" value={stats.activity.assetsThisMonth} />
          <MiniStat label="סה״כ עסקאות" value={stats.activity.totalTransactions} />
          <MiniStat label="סה״כ נכסים" value={stats.activity.totalAssets} />
        </div>
      </div>

      {/* Aggregate Statistics */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowAggregates(!showAggregates)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <PiggyBank size={18} />
            ממוצעים וסטטיסטיקות
          </h2>
          {showAggregates ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showAggregates && (
          <div style={{ marginTop: '16px' }}>
            {/* Main averages */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <ArrowUpRight size={20} style={{ color: 'var(--income)', marginBottom: '4px' }} />
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--income)' }}>
                  {formatNumber(stats.aggregates.avgIncomePerUser)} ₪
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ממוצע הכנסה למשתמש</div>
              </div>
              <div style={{ background: 'rgba(251, 113, 133, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <ArrowDownRight size={20} style={{ color: 'var(--expense)', marginBottom: '4px' }} />
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--expense)' }}>
                  {formatNumber(stats.aggregates.avgExpensePerUser)} ₪
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ממוצע הוצאות למשתמש</div>
              </div>
              <div style={{ background: 'rgba(167, 139, 250, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <Wallet size={20} style={{ color: '#a78bfa', marginBottom: '4px' }} />
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a78bfa' }}>
                  {formatNumber(stats.aggregates.avgNetWorth)} ₪
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ממוצע שווי נכסים</div>
              </div>
            </div>

            {/* Category breakdown */}
            {stats.aggregates.categoryAverages.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-dim)' }}>
                  ממוצע הוצאות לפי קטגוריה
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {stats.aggregates.categoryAverages.slice(0, 8).map((cat, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '12px',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{cat.name}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatNumber(Math.round(cat.avgPerUser))} ₪</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Registration Chart - only show if more than 3 days with registrations */}
      {stats.registrationsByDay.filter(d => d.count > 0).length > 3 && (
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} />
            הרשמות (30 יום אחרונים)
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px', padding: '0 4px' }}>
            {stats.registrationsByDay.map((day, i) => {
              const maxCount = Math.max(...stats.registrationsByDay.map(d => d.count), 1)
              const height = (day.count / maxCount) * 100
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: day.count > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '2px 2px 0 0',
                    height: day.count > 0 ? `${Math.max(height, 10)}%` : '4px',
                    minWidth: '4px',
                    maxWidth: '20px',
                  }}
                  title={`${formatDate(day.date)}: ${day.count} הרשמות`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Mail size={18} />
            משתמשים רשומים ({stats.userList.length})
          </h2>
          <button
            onClick={exportToExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              color: 'var(--accent)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            ייצוא
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
          לחץ על משתמש לצפייה בפרטים
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-dim)' }}>משתמש</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-dim)' }}>הצטרף</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-dim)' }}>כניסה אחרונה</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-dim)' }}>עסקאות</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-dim)' }}>נכסים</th>
              </tr>
            </thead>
            <tbody>
              {stats.userList.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => fetchUserDetails(user.id)}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isOnline(user.lastActiveAt) ? 'var(--income)' : 'var(--text-dim)',
                        flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{user.name || 'ללא שם'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-dim)' }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-dim)' }}>
                    {formatTime(user.lastActiveAt)}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {user.transactions}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {user.assetClasses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {(selectedUser || isLoadingUser) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedUser(null)}
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <X size={18} />
            </button>

            {isLoadingUser ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
              </div>
            ) : selectedUser && (
              <>
                {/* User header */}
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>
                    {selectedUser.user.name || 'ללא שם'}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
                    {selectedUser.user.email}
                  </p>
                </div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--income)' }}>
                      {formatNumber(selectedUser.summary.totalIncome)} ₪
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>סה״כ הכנסות</div>
                  </div>
                  <div style={{ background: 'rgba(251, 113, 133, 0.1)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--expense)' }}>
                      {formatNumber(selectedUser.summary.totalExpense)} ₪
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>סה״כ הוצאות</div>
                  </div>
                  <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {formatNumber(selectedUser.summary.netCashflow)} ₪
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>תזרים נטו</div>
                  </div>
                  <div style={{ background: 'rgba(167, 139, 250, 0.1)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa' }}>
                      {formatNumber(selectedUser.summary.totalAssetValue)} ₪
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>שווי נכסים</div>
                  </div>
                </div>

                {/* Monthly cashflow table */}
                {selectedUser.monthlySummary.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>
                      תזרים חודשי
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '8px', textAlign: 'right', color: 'var(--text-dim)' }}>חודש</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: 'var(--text-dim)' }}>הכנסות</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: 'var(--text-dim)' }}>הוצאות</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: 'var(--text-dim)' }}>נטו</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.monthlySummary.slice(0, 12).map((m, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '8px' }}>{m.month}</td>
                              <td style={{ padding: '8px', color: 'var(--income)' }}>{formatNumber(m.income)}</td>
                              <td style={{ padding: '8px', color: 'var(--expense)' }}>{formatNumber(m.expense)}</td>
                              <td style={{ padding: '8px', color: m.net >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                                {formatNumber(m.net)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Category breakdown */}
                {selectedUser.categorySummary.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>
                      הוצאות לפי קטגוריה
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedUser.categorySummary.slice(0, 8).map((cat, i) => (
                        <div key={i} style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                        }}>
                          <span style={{ color: 'var(--text-dim)' }}>{cat.name}: </span>
                          <span style={{ fontWeight: 600 }}>{formatNumber(cat.total)} ₪</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assets */}
                {selectedUser.assets.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>
                      נכסים ({selectedUser.assets.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedUser.assets.slice(0, 10).map((asset, i) => (
                        <div key={i} style={{
                          background: 'rgba(255,255,255,0.03)',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{asset.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {asset.class} • {asset.provider}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {formatNumber(asset.value)} {asset.currency === 'ILS' ? '₪' : asset.currency}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, subValue, color }: {
  icon: React.ReactNode
  label: string
  value: string
  subValue: string
  color: string
}) {
  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{subValue}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{value.toLocaleString('he-IL')}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{label}</div>
    </div>
  )
}
