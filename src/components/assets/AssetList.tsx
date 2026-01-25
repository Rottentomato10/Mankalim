'use client'

import { useState } from 'react'
import { ValueInput } from '@/components/ui/ValueInput'
import type { AssetClass, Instrument, Provider, Asset } from '@/types'

interface ValueData {
  assetId: string
  value: string
  isInherited: boolean
  inheritedFrom: { month: number; year: number } | null
}

interface ProviderWithAssets extends Provider {
  assets: Asset[]
}

interface InstrumentWithProviders extends Instrument {
  providers: ProviderWithAssets[]
}

interface AssetClassWithChildren extends AssetClass {
  instruments: InstrumentWithProviders[]
}

interface AssetListProps {
  assetClasses: AssetClassWithChildren[]
  values: ValueData[]
  onValueChange: (assetId: string, value: string) => void
  isLoading?: boolean
}

export function AssetList({ assetClasses, values, onValueChange, isLoading }: AssetListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Expand all by default
    const ids = new Set<string>()
    assetClasses.forEach((ac) => {
      ids.add(ac.id)
      ac.instruments.forEach((inst) => {
        ids.add(inst.id)
        inst.providers.forEach((prov) => {
          ids.add(prov.id)
        })
      })
    })
    return ids
  })

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getValueData = (assetId: string): ValueData => {
    return values.find((v) => v.assetId === assetId) || {
      assetId,
      value: '0',
      isInherited: false,
      inheritedFrom: null,
    }
  }

  const calculateSubtotal = (assets: Asset[]): number => {
    return assets.reduce((sum, asset) => {
      const valueData = getValueData(asset.id)
      return sum + parseFloat(valueData.value || '0')
    }, 0)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('he-IL').format(num)
  }

  if (assetClasses.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 16px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>📁</span>
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontWeight: 600 }}>אין נכסים עדיין</h3>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem' }}>עבור לדף &quot;ניהול&quot; כדי להוסיף נכסים</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {assetClasses.map((ac) => {
        const acAssets = ac.instruments.flatMap((i) => i.providers.flatMap((p) => p.assets || []))
        const acTotal = calculateSubtotal(acAssets)

        return (
          <div key={ac.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Asset Class Header */}
            <button
              onClick={() => toggleExpanded(ac.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-dim)', transform: expanded.has(ac.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
                <span style={{ fontWeight: 600 }}>{ac.name}</span>
              </div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }} dir="ltr">
                ₪{formatNumber(acTotal)}
              </span>
            </button>

            {/* Instruments */}
            {expanded.has(ac.id) && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {ac.instruments.map((inst) => {
                  const instAssets = inst.providers.flatMap((p) => p.assets || [])
                  const instTotal = calculateSubtotal(instAssets)

                  return (
                    <div key={inst.id}>
                      {/* Instrument Header */}
                      <button
                        onClick={() => toggleExpanded(inst.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 20px 12px 32px',
                          background: 'transparent',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', transform: expanded.has(inst.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
                          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{inst.name}</span>
                        </div>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }} dir="ltr">
                          ₪{formatNumber(instTotal)}
                        </span>
                      </button>

                      {/* Providers */}
                      {expanded.has(inst.id) && (
                        <div>
                          {inst.providers.map((prov) => {
                            const provTotal = calculateSubtotal(prov.assets || [])

                            return (
                              <div key={prov.id}>
                                {/* Provider Header */}
                                <button
                                  onClick={() => toggleExpanded(prov.id)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 20px 10px 48px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'inherit',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem', transform: expanded.has(prov.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{prov.name}</span>
                                  </div>
                                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }} dir="ltr">
                                    ₪{formatNumber(provTotal)}
                                  </span>
                                </button>

                                {/* Assets */}
                                {expanded.has(prov.id) && prov.assets && (
                                  <div style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    {prov.assets.map((asset) => {
                                      const valueData = getValueData(asset.id)

                                      return (
                                        <div
                                          key={asset.id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 20px 10px 64px'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{asset.name}</span>
                                            {asset.isLiquid && (
                                              <span style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--accent)',
                                                background: 'rgba(56, 189, 248, 0.1)',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                              }}>נזיל</span>
                                            )}
                                          </div>
                                          <ValueInput
                                            value={valueData.value}
                                            currency={asset.currency}
                                            isInherited={valueData.isInherited}
                                            onChange={(value) => onValueChange(asset.id, value)}
                                            disabled={isLoading}
                                          />
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default AssetList
