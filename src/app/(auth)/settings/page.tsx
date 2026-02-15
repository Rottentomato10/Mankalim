'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, ExternalLink } from 'lucide-react'
import { NotificationToggle } from '@/components/ui/NotificationToggle'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDemoSession } from '@/hooks/useDemoSession'
import { useAssets } from '@/hooks/useAssets'
import { useCategories } from '@/hooks/useCategories'

interface Preferences {
  defaultCurrency: string
  notifyEnabled: boolean
  notifyDay: number
  deletionPending: boolean
  deletionDate: string | null
}

export default function SettingsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const { demoUser, isLoading: demoLoading, signOutDemo } = useDemoSession()
  const { assetClasses } = useAssets()
  const { categories, addCategory, deleteCategory } = useCategories()
  const user = session?.user || demoUser
  const isDemo = !session?.user && !!demoUser

  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)

  // Wait until we know if user is in demo mode or has a session
  const authReady = sessionStatus !== 'loading' && !demoLoading

  useEffect(() => {
    if (!authReady) return

    if (isDemo || demoUser) {
      setPreferences({
        defaultCurrency: 'ILS',
        notifyEnabled: false,
        notifyDay: 1,
        deletionPending: false,
        deletionDate: null,
      })
      setIsLoading(false)
    } else if (session?.user) {
      fetchPreferences()
    } else {
      // No session and no demo - shouldn't happen but handle gracefully
      setIsLoading(false)
    }
  }, [authReady, isDemo, demoUser, session])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (!response.ok) throw new Error('Failed to fetch preferences')
      const data = await response.json()
      setPreferences(data)
    } catch {
      setError('שגיאה בטעינת ההגדרות')
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<Preferences>) => {
    if (!preferences || isDemo) return

    setIsSaving(true)
    setError(null)
    setPreferences((prev) => (prev ? { ...prev, ...updates } : null))

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update preferences')
    } catch {
      fetchPreferences()
      setError('שגיאה בשמירת ההגדרות')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = async () => {
    setExportStatus('exporting')
    try {
      // Fetch all data for export
      const [classesRes, valuesRes] = await Promise.all([
        fetch('/api/assets/classes'),
        fetch('/api/export/all'),
      ])

      const classes = await classesRes.json()
      const values = valuesRes.ok ? await valuesRes.json() : { values: [] }

      const exportData = {
        exportDate: new Date().toISOString(),
        assetClasses: classes,
        monthlyValues: values.values || [],
        preferences: preferences,
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `maazanim-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportStatus('success')
      setTimeout(() => setExportStatus('idle'), 3000)
    } catch {
      setExportStatus('error')
      setTimeout(() => setExportStatus('idle'), 3000)
    }
  }

  const handleDeleteAccount = async () => {
    if (isDemo) return
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/user/delete', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to delete account')
      const data = await response.json()
      setPreferences((prev) => prev ? { ...prev, deletionPending: true, deletionDate: data.deletionDate } : null)
      setShowDeleteDialog(false)
    } catch {
      setError('שגיאה במחיקת החשבון')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDeletion = async () => {
    if (isDemo) return
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/user/cancel-deletion', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to cancel deletion')
      setPreferences((prev) => (prev ? { ...prev, deletionPending: false, deletionDate: null } : null))
    } catch {
      setError('שגיאה בביטול המחיקה')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = () => {
    if (isDemo) {
      signOutDemo()
    } else {
      signOut({ callbackUrl: '/login' })
    }
  }

  const handleResetToDefaults = async () => {
    if (isDemo) return
    setIsResetting(true)
    try {
      // Delete all existing asset classes
      for (const ac of assetClasses) {
        await fetch(`/api/assets/classes/${ac.id}`, { method: 'DELETE' })
      }
      // Refetch will trigger default creation in the API
      window.location.reload()
    } catch {
      setError('שגיאה באיפוס הנתונים')
    } finally {
      setIsResetting(false)
      setShowResetDialog(false)
    }
  }

  const getDaysUntilDeletion = () => {
    if (!preferences?.deletionDate) return 0
    const deletionDate = new Date(preferences.deletionDate)
    const finalDate = new Date(deletionDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now = new Date()
    return Math.ceil((finalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Calculate stats for display
  const totalAssets = assetClasses.reduce((sum, ac) =>
    sum + ac.instruments.reduce((s, i) =>
      s + i.providers.reduce((p, pr) => p + (pr.assets?.length || 0), 0), 0), 0)

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

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
        <button
          onClick={handleSignOut}
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
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <LogOut size={16} strokeWidth={1.5} />
          יציאה
        </button>
        <Image
          src="/logo-6.png"
          alt="פורשים כנף"
          width={48}
          height={48}
          style={{ marginBottom: '8px', borderRadius: '12px' }}
          priority
        />
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '2px' }}>פורשים כנף - חינוך פיננסי</p>
        <h1 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px' }}>הגדרות</h1>
        {isDemo && (
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
            מצב צפייה
          </span>
        )}
      </div>

      {/* External Link */}
      <a href="https://www.porsimkanaf.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', marginBottom: '16px' }}>
        <div className="glass-card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '16px',
          cursor: 'pointer',
          color: 'var(--accent)'
        }}>
          <ExternalLink size={18} strokeWidth={1.5} />
          <span style={{ fontWeight: 600 }}>לאתר פורשים כנף</span>
        </div>
      </a>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(251, 113, 133, 0.15)',
          border: '1px solid var(--expense)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--expense)' }}>{error}</p>
        </div>
      )}

      {/* Deletion pending warning */}
      {preferences?.deletionPending && (
        <div style={{
          background: 'rgba(251, 113, 133, 0.15)',
          border: '1px solid var(--expense)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <h3 style={{ margin: 0, color: 'var(--expense)', fontWeight: 600 }}>החשבון מתוכנן למחיקה</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--expense)', opacity: 0.8, fontSize: '0.9rem' }}>
                החשבון יימחק לצמיתות בעוד {getDaysUntilDeletion()} ימים.
              </p>
              <button
                onClick={handleCancelDeletion}
                disabled={isSaving}
                style={{
                  marginTop: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--expense)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ביטול מחיקה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="glass-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user?.image ? (
            <img src={user.image} alt={user.name || 'משתמש'} style={{ width: '64px', height: '64px', borderRadius: '20px' }} />
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              fontSize: '1.5rem',
              fontWeight: 700
            }}>
              {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              {user?.name || 'משתמש'}
              {isDemo && <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginRight: '8px' }}>(דמו)</span>}
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>{user?.email}</p>
          </div>
        </div>
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-around',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{assetClasses.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>קטגוריות</div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--income)' }}>{totalAssets}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>נכסים</div>
          </div>
        </div>
      </div>

      {/* Notifications Card */}
      <div className="glass-card" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>התראות</h3>
        <NotificationToggle
          enabled={preferences?.notifyEnabled || false}
          notifyDay={preferences?.notifyDay || 1}
          onEnabledChange={(enabled) => updatePreferences({ notifyEnabled: enabled })}
          onNotifyDayChange={(day) => updatePreferences({ notifyDay: day })}
          disabled={isSaving || isDemo}
        />
      </div>

      {/* Categories Card */}
      <div className="glass-card" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>קטגוריות הוצאות</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.9rem',
              }}
            >
              <span>{cat.name}</span>
              {!isDemo && (
                <button
                  onClick={() => deleteCategory(cat.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '0',
                    fontSize: '1rem',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {!isDemo && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="קטגוריה חדשה..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '0.9rem',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCategoryName.trim()) {
                  setIsAddingCategory(true)
                  addCategory(newCategoryName.trim()).finally(() => {
                    setNewCategoryName('')
                    setIsAddingCategory(false)
                  })
                }
              }}
            />
            <button
              onClick={() => {
                if (newCategoryName.trim()) {
                  setIsAddingCategory(true)
                  addCategory(newCategoryName.trim()).finally(() => {
                    setNewCategoryName('')
                    setIsAddingCategory(false)
                  })
                }
              }}
              disabled={isAddingCategory || !newCategoryName.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: isAddingCategory ? 'wait' : 'pointer',
                opacity: !newCategoryName.trim() ? 0.5 : 1,
              }}
            >
              {isAddingCategory ? '...' : 'הוסף'}
            </button>
          </div>
        )}
      </div>

      {/* Data Export Card */}
      <div className="glass-card" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700 }}>ייצוא נתונים</h3>
        <p style={{ margin: '0 0 16px 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          הורידו את כל הנתונים שלכם כקובץ JSON
        </p>
        <button
          onClick={handleExportData}
          disabled={exportStatus === 'exporting'}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: exportStatus === 'success' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: `1px solid ${exportStatus === 'success' ? 'var(--income)' : 'var(--accent)'}`,
            color: exportStatus === 'success' ? 'var(--income)' : 'var(--accent)',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: exportStatus === 'exporting' ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {exportStatus === 'exporting' && (
            <div style={{ width: '16px', height: '16px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          )}
          {exportStatus === 'success' && '✓'}
          {exportStatus === 'exporting' ? 'מייצא...' : exportStatus === 'success' ? 'הייצוא הושלם!' : 'ייצוא נתונים'}
        </button>
      </div>

      {/* Danger Zone Card */}
      <div className="glass-card">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--expense)' }}>אזור מסוכן</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isDemo && (
            <button
              onClick={() => setShowResetDialog(true)}
              disabled={isResetting}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid #f59e0b',
                color: '#f59e0b',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: isResetting ? 'wait' : 'pointer'
              }}
            >
              {isResetting ? 'מאפס...' : 'איפוס לברירת מחדל'}
            </button>
          )}
          {!isDemo && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={preferences?.deletionPending}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(251, 113, 133, 0.15)',
                border: '1px solid var(--expense)',
                color: 'var(--expense)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: preferences?.deletionPending ? 'not-allowed' : 'pointer',
                opacity: preferences?.deletionPending ? 0.5 : 1
              }}
            >
              מחיקת חשבון
            </button>
          )}
        </div>
      </div>

      {/* App Info */}
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.75rem'
      }}>
        <p style={{ margin: 0 }}>מנכ״לים v1.0.0</p>
        <p style={{ margin: '4px 0 0 0' }}>מעקב פיננסי אישי - תזרים ונכסים</p>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title="מחיקת חשבון"
        message="האם אתם בטוחים שברצונכם למחוק את החשבון? כל הנתונים יימחקו לצמיתות."
        confirmText="מחק חשבון"
        cancelText="ביטול"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleResetToDefaults}
        title="איפוס לברירת מחדל"
        message="האם אתם בטוחים? כל הקטגוריות, המוצרים והספקים יימחקו ויוחלפו בברירות המחדל (נדל״ן, פנסיוני, השקעות)."
        confirmText="אפס"
        cancelText="ביטול"
        variant="danger"
        isLoading={isResetting}
      />
    </div>
  )
}
