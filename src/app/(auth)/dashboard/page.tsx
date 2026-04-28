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

const COLORS = ['#0d9488', '#22c55e', '#f43f5e', '#e59500', '#8b5cf6', '#ec4899', '#06b6d4']

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
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

        const calculateTotals = (transactions: any[]) => {
          let income = 0
          let expenses = 0
          transactions.forEach((t: any) => {
            if (t.type === 'INCOME') income += parseFloat(t.amount)
            else expenses += parseFloat(t.amount)
          })
          return { income, expenses, balance: income - expenses }
        }

        const allFetches = [
          fetch(`/api/transactions?month=${currentMonth}&year=${currentYear}&limit=1000`),
          fetch(`/api/transactions?month=${prevMonth}&year=${prevYear}&limit=1000`),
          ...Array.from({ length: currentMonth }, (_, i) =>
            fetch(`/api/transactions?month=${i + 1}&year=${currentYear}&limit=1000`)
          )
        ]

        const allResponses = await Promise.all(allFetches)
        const allData = await Promise.all(allResponses.map(r => r.ok ? r.json() : { transactions: [] }))

        const currentData = allData[0]
        const prevData = allData[1]
        const ytdDataList = allData.slice(2)

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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(num || 0)
  }

  const formatPercent = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '—'
    const sign = num > 0 ? '+' : ''
    return `${sign}${num.toFixed(1)}%`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="card-sm" style={{ padding: '10px', fontSize: '0.8rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '2px' }}>{label}</p>
          <p style={{ color: 'var(--accent)' }}>{formatNumber(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="card-sm" style={{ padding: '10px', fontSize: '0.8rem' }}>
          <p style={{ fontWeight: 600 }}>{payload[0].name}</p>
          <p style={{ color: 'var(--accent)' }}>{formatNumber(payload[0].value)}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{payload[0].payload.percent.toFixed(1)}%</p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ color: 'var(--expense)' }}>{error || 'שגיאה בטעינת הנתונים'}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>דשבורד</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.8rem' }}>סקירה פיננסית</p>
          <div style={{ display: 'flex', gap: '4px' }}>
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
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: timeRange === opt.value ? 'var(--accent)' : 'var(--hover-bg)',
                  color: timeRange === opt.value ? '#fff' : 'var(--text-dim)',
                  fontWeight: timeRange === opt.value ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cashflow Summary */}
      {cashflow && (
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '0.9rem', fontWeight: 600 }}>תזרים חודשי</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <ArrowUpCircle style={{ width: '13px', height: '13px', color: 'var(--income)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>הכנסות</span>
              </div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--income)' }} dir="ltr">
                {formatNumber(cashflow.currentMonth.income)}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <ArrowDownCircle style={{ width: '13px', height: '13px', color: 'var(--expense)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>הוצאות</span>
              </div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--expense)' }} dir="ltr">
                {formatNumber(cashflow.currentMonth.expenses)}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <DollarSign style={{ width: '13px', height: '13px', color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>יתרה</span>
              </div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: cashflow.currentMonth.balance >= 0 ? 'var(--income)' : 'var(--expense)' }} dir="ltr">
                {formatNumber(cashflow.currentMonth.balance)}
              </p>
            </div>
          </div>
          <div style={{ padding: '10px', background: 'var(--hover-bg)', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.75rem', color: 'var(--text-dim)' }}>מתחילת השנה</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--income)' }}>+{formatNumber(cashflow.yearToDate.income)}</span>
                <span style={{ color: 'var(--text-dim)', margin: '0 6px', opacity: 0.4 }}>|</span>
                <span style={{ color: 'var(--expense)' }}>-{formatNumber(cashflow.yearToDate.expenses)}</span>
              </div>
              <span style={{ fontWeight: 700, color: cashflow.yearToDate.balance >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                = {formatNumber(cashflow.yearToDate.balance)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Card */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '2px' }}>סה״כ נכסים</p>
        <p style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '14px', letterSpacing: '-0.5px' }} dir="ltr">{formatNumber(analytics.currentTotal)}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <div className="card-sm" style={{ background: 'var(--hover-bg)', border: 'none' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginBottom: '2px' }}>חודשי</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: analytics.monthlyChange >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatPercent(analytics.monthlyChangePercent)}
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }} dir="ltr">{formatNumber(analytics.monthlyChange)}</p>
          </div>

          <div className="card-sm" style={{ background: 'var(--hover-bg)', border: 'none' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginBottom: '2px' }}>YTD</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: analytics.ytdChange >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatPercent(analytics.ytdChangePercent)}
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }} dir="ltr">{formatNumber(analytics.ytdChange)}</p>
          </div>

          <div className="card-sm" style={{ background: 'var(--hover-bg)', border: 'none' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginBottom: '2px' }}>שנתי</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: analytics.yearlyChange >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatPercent(analytics.yearlyChangePercent)}
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }} dir="ltr">{formatNumber(analytics.yearlyChange)}</p>
          </div>

          <div className="card-sm" style={{ background: 'var(--hover-bg)', border: 'none' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginBottom: '2px' }}>ממוצע חודשי</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: analytics.avgMonthlyGrowth >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatPercent(analytics.avgMonthlyGrowth)}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginBottom: '6px' }}>נזילים</p>
          <p style={{ color: 'var(--income)', fontSize: '0.9rem', fontWeight: 700 }} dir="ltr">{formatNumber(analytics.liquidTotal)}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.6rem', marginTop: '2px' }}>
            {analytics.currentTotal > 0 ? ((analytics.liquidTotal / analytics.currentTotal) * 100).toFixed(0) : 0}%
          </p>
        </div>

        <div className="card" style={{ padding: '14px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginBottom: '6px' }}>לא נזילים</p>
          <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 700 }} dir="ltr">{formatNumber(analytics.illiquidTotal)}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.6rem', marginTop: '2px' }}>
            {analytics.currentTotal > 0 ? ((analytics.illiquidTotal / analytics.currentTotal) * 100).toFixed(0) : 0}%
          </p>
        </div>

        <div className="card" style={{ padding: '14px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginBottom: '6px' }}>שיעור מילוי</p>
          <p style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 700 }}>{analytics.fillRate.toFixed(0)}%</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.6rem', marginTop: '2px' }}>
            {analytics.assetsWithValues}/{analytics.totalAssets}
          </p>
        </div>
      </div>

      {/* Timeline Chart */}
      {analytics.monthlyTotals.length > 0 && (
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '14px' }}>מגמת שווי</h3>
          <div style={{ height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyTotals}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--active-bg)" />
                <XAxis
                  dataKey="label"
                  stroke="var(--text-dim)"
                  tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                />
                <YAxis
                  stroke="var(--text-dim)"
                  tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0d9488"
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
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '14px' }}>לפי קבוצת נכסים</h3>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.classDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
            {analytics.classDistribution.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: item.color }} />
                <span style={{ color: 'var(--text-dim)' }}>{item.name} ({item.percent.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.currencyDistribution.length > 0 && (
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '14px' }}>לפי מטבע</h3>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.currencyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
            {analytics.currencyDistribution.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: item.color }} />
                <span style={{ color: 'var(--text-dim)' }}>{item.name} ({item.percent.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.liquidityDistribution.length > 0 && (
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '14px' }}>לפי נזילות</h3>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.liquidityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
            {analytics.liquidityDistribution.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: item.color }} />
                <span style={{ color: 'var(--text-dim)' }}>{item.name} ({item.percent.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
        {analytics.topAsset && (
          <div className="card" style={{ padding: '14px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginBottom: '6px' }}>נכס מוביל</p>
            <p style={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{analytics.topAsset.assetName}</p>
            <p style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 700 }} dir="ltr">{formatNumber(analytics.topAsset.current)}</p>
          </div>
        )}

        {analytics.bestGrowth && (
          <div className="card" style={{ padding: '14px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginBottom: '6px' }}>צמיחה מובילה</p>
            <p style={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{analytics.bestGrowth.assetName}</p>
            <p style={{ color: 'var(--income)', fontSize: '0.9rem', fontWeight: 700 }}>{formatPercent(analytics.bestGrowth.changePercent)}</p>
          </div>
        )}

        {analytics.worstGrowth && (
          <div className="card" style={{ padding: '14px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginBottom: '6px' }}>ירידה חודשית</p>
            <p style={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{analytics.worstGrowth.assetName}</p>
            <p style={{ color: 'var(--expense)', fontSize: '0.9rem', fontWeight: 700 }}>{formatPercent(analytics.worstGrowth.changePercent)}</p>
          </div>
        )}
      </div>

      {/* Monthly Contributions */}
      {analytics.monthlyContributions.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '14px' }}>תרומה חודשית</h3>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyContributions}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--active-bg)" />
                <XAxis
                  dataKey="label"
                  stroke="var(--text-dim)"
                  tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                />
                <YAxis
                  stroke="var(--text-dim)"
                  tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="contribution"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
