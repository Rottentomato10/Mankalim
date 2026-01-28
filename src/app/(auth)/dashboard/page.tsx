'use client'

import { useState, useEffect } from 'react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useAuth } from '@/hooks/useAuth'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts'
import {
  TrendingUp, Calendar, DollarSign, Target, Activity, BarChart3, Zap, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react'

const COLORS = ['#38bdf8', '#4ade80', '#fb7185', '#f59e0b', '#a78bfa', '#f472b6', '#34d399']

interface CashflowData {
  currentMonth: { income: number; expenses: number; balance: number }
  previousMonth: { income: number; expenses: number; balance: number }
  yearToDate: { income: number; expenses: number; balance: number }
}

function useCashflowData(): { data: CashflowData | null; isLoading: boolean } {
  const [data, setData] = useState<CashflowData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        // Fetch current month, previous month, and YTD
        const [currentRes, prevRes] = await Promise.all([
          fetch(`/api/transactions?month=${currentMonth}&year=${currentYear}&limit=1000`),
          fetch(`/api/transactions?month=${currentMonth - 1 || 12}&year=${currentMonth === 1 ? currentYear - 1 : currentYear}&limit=1000`),
        ])

        const calculateTotals = (transactions: any[]) => {
          let income = 0
          let expenses = 0
          transactions.forEach((t: any) => {
            if (t.type === 'INCOME') income += parseFloat(t.amount)
            else expenses += parseFloat(t.amount)
          })
          return { income, expenses, balance: income - expenses }
        }

        const currentData = currentRes.ok ? await currentRes.json() : { transactions: [] }
        const prevData = prevRes.ok ? await prevRes.json() : { transactions: [] }

        // Calculate YTD by fetching all months in parallel
        const ytdPromises = Array.from({ length: currentMonth }, (_, i) =>
          fetch(`/api/transactions?month=${i + 1}&year=${currentYear}&limit=1000`)
        )
        const ytdResponses = await Promise.all(ytdPromises)
        const ytdDataList = await Promise.all(ytdResponses.map(r => r.ok ? r.json() : { transactions: [] }))

        let ytdIncome = 0
        let ytdExpenses = 0
        ytdDataList.forEach(d => {
          const totals = calculateTotals(d.transactions || [])
          ytdIncome += totals.income
          ytdExpenses += totals.expenses
        })

        setData({
          currentMonth: calculateTotals(currentData.transactions || []),
          previousMonth: calculateTotals(prevData.transactions || []),
          yearToDate: { income: ytdIncome, expenses: ytdExpenses, balance: ytdIncome - ytdExpenses }
        })
      } catch (e) {
        console.error('Failed to fetch cashflow data:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return { data, isLoading }
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState(12)
  const { analytics, isLoading, error } = useDashboardData(timeRange)
  const { data: cashflow, isLoading: cashflowLoading } = useCashflowData()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(num || 0)
  }

  const formatPercent = (num: number) => {
    if (!num && num !== 0) return '—'
    const sign = num > 0 ? '+' : ''
    return `${sign}${num.toFixed(1)}%`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card-sm" style={{ padding: '12px', fontSize: '0.85rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</p>
          <p style={{ color: 'var(--accent)' }}>{formatNumber(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card-sm" style={{ padding: '12px', fontSize: '0.85rem' }}>
          <p style={{ fontWeight: 600 }}>{payload[0].name}</p>
          <p style={{ color: 'var(--accent)' }}>{formatNumber(payload[0].value)}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{payload[0].payload.percent.toFixed(1)}%</p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-dim)' }}>טוען...</p>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ color: 'var(--expense)' }}>{error || 'שגיאה בטעינת הנתונים'}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Branding */}
      <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
        <button
          onClick={handleLogout}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-dim)',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          יציאה
        </button>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '2px' }}>פורשים כנף - חינוך פיננסי</p>
        <h1 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px' }}>דשבורד</h1>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 3, label: '3ח׳' },
            { value: 6, label: '6ח׳' },
            { value: 12, label: 'שנה' },
            { value: 24, label: '2ש׳' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: timeRange === opt.value ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                background: timeRange === opt.value ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                color: timeRange === opt.value ? 'var(--accent)' : 'var(--text-dim)',
                fontWeight: timeRange === opt.value ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cashflow Summary */}
      {cashflow && (
        <div className="glass-card" style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>
            <span style={{ marginLeft: '8px' }}>💸</span>תזרים חודשי
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <ArrowUpCircle style={{ width: '14px', height: '14px', color: 'var(--income)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>הכנסות</span>
              </div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--income)' }} dir="ltr">
                {formatNumber(cashflow.currentMonth.income)}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <ArrowDownCircle style={{ width: '14px', height: '14px', color: 'var(--expense)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>הוצאות</span>
              </div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--expense)' }} dir="ltr">
                {formatNumber(cashflow.currentMonth.expenses)}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <DollarSign style={{ width: '14px', height: '14px', color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>יתרה</span>
              </div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: cashflow.currentMonth.balance >= 0 ? 'var(--income)' : 'var(--expense)' }} dir="ltr">
                {formatNumber(cashflow.currentMonth.balance)}
              </p>
            </div>
          </div>
          {/* YTD Cashflow */}
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>מתחילת השנה (YTD)</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: 'var(--income)', fontSize: '0.85rem' }}>+{formatNumber(cashflow.yearToDate.income)}</span>
                <span style={{ color: 'var(--text-dim)', margin: '0 8px' }}>|</span>
                <span style={{ color: 'var(--expense)', fontSize: '0.85rem' }}>-{formatNumber(cashflow.yearToDate.expenses)}</span>
              </div>
              <span style={{ fontWeight: 700, color: cashflow.yearToDate.balance >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                = {formatNumber(cashflow.yearToDate.balance)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Card */}
      <div className="glass-card" style={{ marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '4px' }}>סה״כ נכסים</p>
        <p style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }} dir="ltr">{formatNumber(analytics.currentTotal)}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div className="glass-card-sm">
            <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>חודשי</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: analytics.monthlyChange >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatPercent(analytics.monthlyChangePercent)}
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }} dir="ltr">{formatNumber(analytics.monthlyChange)}</p>
          </div>

          <div className="glass-card-sm">
            <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>YTD</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: analytics.ytdChange >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatPercent(analytics.ytdChangePercent)}
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }} dir="ltr">{formatNumber(analytics.ytdChange)}</p>
          </div>

          <div className="glass-card-sm">
            <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>שנתי</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: analytics.yearlyChange >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatPercent(analytics.yearlyChangePercent)}
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }} dir="ltr">{formatNumber(analytics.yearlyChange)}</p>
          </div>

          <div className="glass-card-sm">
            <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>ממוצע חודשי</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: analytics.avgMonthlyGrowth >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatPercent(analytics.avgMonthlyGrowth)}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign style={{ width: '16px', height: '16px', color: 'var(--income)' }} />
            <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>נכסים נזילים</p>
          </div>
          <p style={{ color: 'var(--income)', fontSize: '1rem', fontWeight: 700 }} dir="ltr">{formatNumber(analytics.liquidTotal)}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginTop: '4px' }}>
            {analytics.currentTotal > 0 ? ((analytics.liquidTotal / analytics.currentTotal) * 100).toFixed(0) : 0}% מהסך
          </p>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Target style={{ width: '16px', height: '16px', color: 'var(--expense)' }} />
            <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>לא נזילים</p>
          </div>
          <p style={{ color: 'var(--expense)', fontSize: '1rem', fontWeight: 700 }} dir="ltr">{formatNumber(analytics.illiquidTotal)}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginTop: '4px' }}>
            {analytics.currentTotal > 0 ? ((analytics.illiquidTotal / analytics.currentTotal) * 100).toFixed(0) : 0}% מהסך
          </p>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Activity style={{ width: '16px', height: '16px', color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>שיעור מילוי</p>
          </div>
          <p style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: 700 }}>{analytics.fillRate.toFixed(0)}%</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginTop: '4px' }}>
            {analytics.assetsWithValues} מתוך {analytics.totalAssets}
          </p>
        </div>
      </div>

      {/* Timeline Chart */}
      {analytics.monthlyTotals.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>מגמת שווי</h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyTotals}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Distribution Charts */}
      {analytics.classDistribution.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>לפי קבוצת נכסים</h3>
          <div style={{ height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.classDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analytics.classDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
            {analytics.classDistribution.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                <span style={{ color: 'var(--text-dim)' }}>{item.name} ({item.percent.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.currencyDistribution.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>לפי מטבע</h3>
          <div style={{ height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.currencyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analytics.currencyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
            {analytics.currencyDistribution.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                <span style={{ color: 'var(--text-dim)' }}>{item.name} ({item.percent.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.liquidityDistribution.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>לפי נזילות</h3>
          <div style={{ height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.liquidityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analytics.liquidityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
            {analytics.liquidityDistribution.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                <span style={{ color: 'var(--text-dim)' }}>{item.name} ({item.percent.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {analytics.topAsset && (
          <div className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <BarChart3 style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>נכס מוביל</p>
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{analytics.topAsset.assetName}</p>
            <p style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: 700 }} dir="ltr">{formatNumber(analytics.topAsset.current)}</p>
          </div>
        )}

        {analytics.bestGrowth && (
          <div className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingUp style={{ width: '16px', height: '16px', color: 'var(--income)' }} />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>צמיחה מובילה</p>
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{analytics.bestGrowth.assetName}</p>
            <p style={{ color: 'var(--income)', fontSize: '1rem', fontWeight: 700 }}>{formatPercent(analytics.bestGrowth.changePercent)}</p>
          </div>
        )}

        {analytics.worstGrowth && (
          <div className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap style={{ width: '16px', height: '16px', color: 'var(--expense)' }} />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>ירידה חודשית</p>
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{analytics.worstGrowth.assetName}</p>
            <p style={{ color: 'var(--expense)', fontSize: '1rem', fontWeight: 700 }}>{formatPercent(analytics.worstGrowth.changePercent)}</p>
          </div>
        )}
      </div>

      {/* Monthly Contributions */}
      {analytics.monthlyContributions.length > 0 && (
        <div className="glass-card">
          <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>תרומה חודשית</h3>
          <div style={{ height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyContributions}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="contribution"
                  fill="#38bdf8"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
