'use client'

import { useState, useEffect, useRef } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'

type ItemType = 'assetClass' | 'instrument' | 'provider' | 'asset'

interface AddItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; isLiquid?: boolean; currency?: string; notes?: string }) => void
  type: ItemType
  parentName?: string
  isLoading?: boolean
}

const typeLabels: Record<ItemType, { title: string; placeholder: string }> = {
  assetClass: { title: 'הוספת קטגוריה', placeholder: 'שם הקטגוריה (לדוגמה: נזיל, פנסיוני)' },
  instrument: { title: 'הוספת מכשיר', placeholder: 'שם המכשיר (לדוגמה: חשבון בנק, קרן פנסיה)' },
  provider: { title: 'הוספת ספק', placeholder: 'שם הספק (לדוגמה: בנק הפועלים, מגדל)' },
  asset: { title: 'הוספת נכס', placeholder: 'שם הנכס' },
}

const CURRENCIES = [
  { code: 'ILS', symbol: '₪' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
]

export function AddItemDialog({ isOpen, onClose, onSubmit, type, parentName, isLoading }: AddItemDialogProps) {
  const [name, setName] = useState('')
  const [isLiquid, setIsLiquid] = useState(false)
  const [currency, setCurrency] = useState('ILS')
  const [notes, setNotes] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setIsLiquid(false)
      setCurrency('ILS')
      setNotes('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (type === 'asset') {
      onSubmit({ name: name.trim(), isLiquid, currency, notes: notes.trim() || undefined })
    } else {
      onSubmit({ name: name.trim() })
    }
  }

  if (!isOpen) return null

  const { title, placeholder } = typeLabels[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200 !p-0">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              {parentName && <p className="text-white/50 text-sm mt-1">תחת: {parentName}</p>}
            </div>

            <div>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={placeholder}
                className="w-full py-3 px-4 rounded-xl bg-white/5 border border-glass-border text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors"
                maxLength={type === 'asset' ? 200 : 100}
              />
            </div>

            {type === 'asset' && (
              <>
                <div className="flex items-center justify-between py-2">
                  <span className="text-white/80">נכס נזיל</span>
                  <button
                    type="button"
                    onClick={() => setIsLiquid(!isLiquid)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${isLiquid ? 'bg-accent' : 'bg-white/20'}`}
                  >
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${isLiquid ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div>
                  <label className="text-white/70 text-sm block mb-2">מטבע</label>
                  <div className="flex gap-2">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setCurrency(c.code)}
                        className={`flex-1 py-2 px-3 rounded-xl border transition-colors ${
                          currency === c.code
                            ? 'bg-accent/20 border-accent text-accent'
                            : 'bg-white/5 border-glass-border text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {c.symbol} {c.code}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/70 text-sm block mb-2">הערות (אופציונלי)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="הערות נוספות..."
                    rows={2}
                    maxLength={1000}
                    className="w-full py-3 px-4 rounded-xl bg-white/5 border border-glass-border text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 p-4 border-t border-glass-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors disabled:opacity-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent/90 text-background font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'שומר...' : 'הוסף'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}

export default AddItemDialog
