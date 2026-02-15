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

interface AdminStats {
  users: UserStats
  activity: ActivityStats
  financials: { totalManagedValue: string }
  userList: UserInfo[]
  registrationsByDay: RegistrationDay[]
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      router.push('/')
      return
    }

    fetchStats()
  }, [session, status, router])

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

  if (status === 'loading' || isLoading) {
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

      {/* Registration Chart */}
      {stats.registrationsByDay.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} />
            הרשמות (30 יום אחרונים)
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px' }}>
            {stats.registrationsByDay.map((day, i) => {
              const maxCount = Math.max(...stats.registrationsByDay.map(d => d.count), 1)
              const height = (day.count / maxCount) * 100
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: 'var(--accent)',
                    borderRadius: '4px 4px 0 0',
                    height: `${Math.max(height, 5)}%`,
                    opacity: day.count > 0 ? 1 : 0.3,
                    minWidth: '8px',
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
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={18} />
          משתמשים רשומים ({stats.userList.length})
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-dim)' }}>משתמש</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-dim)' }}>הצטרף</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-dim)' }}>פעילות</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-dim)' }}>עסקאות</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-dim)' }}>נכסים</th>
              </tr>
            </thead>
            <tbody>
              {stats.userList.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
