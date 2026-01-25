'use client'

import { useState, useMemo } from 'react'
import { MonthPicker } from '@/components/ui/MonthPicker'
import { BalanceSummary } from '@/components/ui/BalanceSummary'
import { QuickFilters } from '@/components/ui/QuickFilters'
import { ValueInput } from '@/components/ui/ValueInput'
import { useMonthlyValues } from '@/hooks/useMonthlyValues'
import { useAssets } from '@/hooks/useAssets'
import { useDemoSession } from '@/hooks/useDemoSession'
import { useSession } from 'next-auth/react'

interface FilterState {
  assetClass: string | null
  isLiquid: boolean | null
  currency: string | null
}

export default function HomePage() {
  const { data: session } = useSession()
  const { demoUser } = useDemoSession()
  const isDemo = !session?.user && !!demoUser

  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const [filters, setFilters] = useState<FilterState>({
    assetClass: null,
    isLiquid: null,
    currency: null,
  })
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set())

  // Add asset form state
  const [isAddingAsset, setIsAddingAsset] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [newItemParentId, setNewItemParentId] = useState('')
  const [newItemNickname, setNewItemNickname] = useState('')
  const [newItemIsLiquid, setNewItemIsLiquid] = useState(true)
  const [newItemCurrency, setNewItemCurrency] = useState('ILS')
  const [isAddingLoading, setIsAddingLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const { assetClasses, isLoading: assetsLoading, createAsset, createAssetClass, createInstrument, createProvider, deleteAssetClass, deleteInstrument, deleteProvider, updateAssetClass, updateInstrument, updateProvider } = useAssets()

  // Inline creation state
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newProductName, setNewProductName] = useState('')
  const [newProviderName, setNewProviderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { data, exchangeRates, isLoading: valuesLoading, error, setValue } = useMonthlyValues(month, year)

  const handleMonthChange = (newMonth: number, newYear: number) => {
    setMonth(newMonth)
    setYear(newYear)
  }

  const handleValueChange = async (assetId: string, value: string) => {
    await setValue(assetId, value)
  }

  const isLoading = assetsLoading || valuesLoading

  // Get value for an asset
  const getValueData = (assetId: string) => {
    return data?.values?.find((v) => v.assetId === assetId) || {
      assetId,
      value: '0',
      isInherited: false,
      inheritedFrom: null,
    }
  }

  // Filter assets based on current filters
  const filteredAssetClasses = useMemo(() => {
    return assetClasses
      .filter(ac => !filters.assetClass || ac.id === filters.assetClass)
      .map(ac => ({
        ...ac,
        instruments: ac.instruments.map(inst => ({
          ...inst,
          providers: inst.providers.map(prov => ({
            ...prov,
            assets: (prov.assets || []).filter(asset => {
              if (filters.isLiquid !== null && asset.isLiquid !== filters.isLiquid) return false
              if (filters.currency && asset.currency !== filters.currency) return false
              return true
            })
          })).filter(prov => prov.assets.length > 0)
        })).filter(inst => inst.providers.length > 0)
      })).filter(ac => ac.instruments.length > 0)
  }, [assetClasses, filters])

  // Calculate filtered total
  const filteredTotal = useMemo(() => {
    let total = 0
    filteredAssetClasses.forEach(ac => {
      ac.instruments.forEach(inst => {
        inst.providers.forEach(prov => {
          prov.assets.forEach(asset => {
            const valueData = getValueData(asset.id)
            total += parseFloat(valueData.value || '0')
          })
        })
      })
    })
    return total
  }, [filteredAssetClasses, data])

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('he-IL').format(num)
  }

  const toggleClass = (classId: string) => {
    setExpandedClasses(prev => {
      const next = new Set(prev)
      if (next.has(classId)) {
        next.delete(classId)
      } else {
        next.add(classId)
      }
      return next
    })
  }

  const hasActiveFilters = filters.assetClass || filters.isLiquid !== null || filters.currency

  // Flatten data for add asset form
  const categories = assetClasses.map(ac => ({
    id: ac.id,
    name: ac.name,
  }))

  const products = assetClasses.flatMap(ac =>
    ac.instruments.map(inst => ({
      id: inst.id,
      name: inst.name,
      parentId: ac.id,
      parentName: ac.name,
    }))
  )

  const providers = assetClasses.flatMap(ac =>
    ac.instruments.flatMap(inst =>
      inst.providers.map(prov => ({
        id: prov.id,
        name: prov.name,
        parentId: inst.id,
        parentName: inst.name,
        categoryName: ac.name,
      }))
    )
  )

  const getProductsForCategory = (categoryId: string) => {
    return products.filter(p => p.parentId === categoryId)
  }

  const getProvidersForProduct = (productId: string) => {
    return providers.filter(p => p.parentId === productId)
  }

  const getAutoAssetName = () => {
    const category = categories.find(c => c.id === selectedCategoryId)
    const product = products.find(p => p.id === selectedProductId)
    const provider = providers.find(p => p.id === newItemParentId)
    if (category && product && provider) {
      return `${product.name} ${provider.name}`
    }
    return ''
  }

  const handleAddAsset = async () => {
    const autoName = getAutoAssetName()
    if (!autoName || !newItemParentId || isDemo) return
    setIsAddingLoading(true)

    try {
      await createAsset(newItemParentId, {
        name: newItemNickname.trim() || autoName,
        isLiquid: newItemIsLiquid,
        currency: newItemCurrency,
        notes: newItemNickname.trim() ? autoName : undefined,
      })
      setNewItemNickname('')
      setNewItemParentId('')
      setSelectedCategoryId('')
      setSelectedProductId('')
      setNewItemIsLiquid(true)
      setNewItemCurrency('ILS')
      setIsAddingAsset(false)
    } finally {
      setIsAddingLoading(false)
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
            מצב צפייה בלבד - התחבר עם Google כדי לנהל את הנכסים שלך
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '2px' }}>פורשים כנף - חינוך פיננסי</p>
        <h1 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px' }}>מאזן</h1>
        {isDemo && (
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
            מצב צפייה
          </span>
        )}
      </div>

      {/* Add Asset Section */}
      {!assetsLoading && (
        <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isAddingAsset ? '16px' : '0'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              הוסף נכס חדש
            </h2>
            {!isDemo && !isAddingAsset && (
              <button
                onClick={() => {
                  setIsAddingAsset(true)
                  setNewItemNickname('')
                  setSelectedCategoryId('')
                  setSelectedProductId('')
                  setNewItemParentId('')
                  setNewItemIsLiquid(true)
                  setNewItemCurrency('ILS')
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>+</span> התחל
              </button>
            )}
            {isAddingAsset && (
              <>
                <button
                  onClick={() => {
                    setIsEditMode(!isEditMode)
                    setEditingId(null)
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: isEditMode ? 'rgba(251, 113, 133, 0.2)' : 'rgba(255,255,255,0.1)',
                    border: isEditMode ? '1px solid var(--expense)' : 'none',
                    color: isEditMode ? 'var(--expense)' : '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {isEditMode ? 'סיום עריכה' : 'עריכה'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingAsset(false)
                    setIsEditMode(false)
                    setEditingId(null)
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  ביטול
                </button>
              </>
            )}
          </div>

          {/* Add Asset Form */}
          {isAddingAsset && (
            <div>
              {/* Category Selection */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'block' }}>
                  1. בחר קטגוריה
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  {categories.map(cat => (
                    <div key={cat.id} style={{ position: 'relative', display: 'inline-flex' }}>
                      {editingId === `cat-${cat.id}` ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={async () => {
                            if (editingName.trim() && editingName !== cat.name) {
                              await updateAssetClass(cat.id, { name: editingName.trim() })
                            }
                            setEditingId(null)
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              if (editingName.trim() && editingName !== cat.name) {
                                await updateAssetClass(cat.id, { name: editingName.trim() })
                              }
                              setEditingId(null)
                            } else if (e.key === 'Escape') {
                              setEditingId(null)
                            }
                          }}
                          autoFocus
                          style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: '2px solid var(--accent)',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            width: '120px'
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditMode) {
                              setEditingId(`cat-${cat.id}`)
                              setEditingName(cat.name)
                            } else {
                              setSelectedCategoryId(cat.id)
                              setSelectedProductId('')
                              setNewItemParentId('')
                            }
                          }}
                          style={{
                            padding: '10px 16px',
                            paddingLeft: isEditMode ? '28px' : '16px',
                            borderRadius: '10px',
                            border: selectedCategoryId === cat.id ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                            background: selectedCategoryId === cat.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                            color: selectedCategoryId === cat.id ? 'var(--accent)' : '#fff',
                            fontWeight: selectedCategoryId === cat.id ? 600 : 400,
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          {cat.name}
                        </button>
                      )}
                      {isEditMode && editingId !== `cat-${cat.id}` && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm(`למחוק את "${cat.name}"?`)) {
                              await deleteAssetClass(cat.id)
                              if (selectedCategoryId === cat.id) {
                                setSelectedCategoryId('')
                                setSelectedProductId('')
                              }
                            }
                          }}
                          style={{
                            position: 'absolute',
                            right: '4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(251, 113, 133, 0.3)',
                            color: 'var(--expense)',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Add new category inline */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="קטגוריה חדשה"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px dashed rgba(56, 189, 248, 0.5)',
                        background: 'rgba(255,255,255,0.03)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        width: '120px'
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && newCategoryName.trim() && !isCreating) {
                          setIsCreating(true)
                          await createAssetClass(newCategoryName.trim())
                          setNewCategoryName('')
                          setIsCreating(false)
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={!newCategoryName.trim() || isCreating}
                      onClick={async () => {
                        if (newCategoryName.trim() && !isCreating) {
                          setIsCreating(true)
                          await createAssetClass(newCategoryName.trim())
                          setNewCategoryName('')
                          setIsCreating(false)
                        }
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'var(--accent)',
                        color: '#000',
                        fontWeight: 600,
                        cursor: newCategoryName.trim() ? 'pointer' : 'not-allowed',
                        opacity: newCategoryName.trim() ? 1 : 0.5
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              {selectedCategoryId && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'block' }}>
                    2. בחר מוצר
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {getProductsForCategory(selectedCategoryId).map(prod => (
                      <div key={prod.id} style={{ position: 'relative', display: 'inline-flex' }}>
                        {editingId === `prod-${prod.id}` ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={async () => {
                              if (editingName.trim() && editingName !== prod.name) {
                                await updateInstrument(prod.id, { name: editingName.trim() })
                              }
                              setEditingId(null)
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                if (editingName.trim() && editingName !== prod.name) {
                                  await updateInstrument(prod.id, { name: editingName.trim() })
                                }
                                setEditingId(null)
                              } else if (e.key === 'Escape') {
                                setEditingId(null)
                              }
                            }}
                            autoFocus
                            style={{
                              padding: '10px 16px',
                              borderRadius: '10px',
                              border: '2px solid var(--income)',
                              background: 'rgba(74, 222, 128, 0.15)',
                              color: '#fff',
                              fontSize: '0.9rem',
                              width: '120px'
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditMode) {
                                setEditingId(`prod-${prod.id}`)
                                setEditingName(prod.name)
                              } else {
                                setSelectedProductId(prod.id)
                                setNewItemParentId('')
                              }
                            }}
                            style={{
                              padding: '10px 16px',
                              paddingLeft: isEditMode ? '28px' : '16px',
                              borderRadius: '10px',
                              border: selectedProductId === prod.id ? '2px solid var(--income)' : '1px solid rgba(255,255,255,0.1)',
                              background: selectedProductId === prod.id ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.03)',
                              color: selectedProductId === prod.id ? 'var(--income)' : '#fff',
                              fontWeight: selectedProductId === prod.id ? 600 : 400,
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            {prod.name}
                          </button>
                        )}
                        {isEditMode && editingId !== `prod-${prod.id}` && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (confirm(`למחוק את "${prod.name}"?`)) {
                                await deleteInstrument(prod.id)
                                if (selectedProductId === prod.id) {
                                  setSelectedProductId('')
                                  setNewItemParentId('')
                                }
                              }
                            }}
                            style={{
                              position: 'absolute',
                              right: '4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: 'none',
                              background: 'rgba(251, 113, 133, 0.3)',
                              color: 'var(--expense)',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {/* Add new product inline */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="מוצר חדש"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px dashed rgba(74, 222, 128, 0.5)',
                          background: 'rgba(255,255,255,0.03)',
                          color: '#fff',
                          fontSize: '0.85rem',
                          width: '120px'
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && newProductName.trim() && !isCreating) {
                            setIsCreating(true)
                            await createInstrument(selectedCategoryId, newProductName.trim())
                            setNewProductName('')
                            setIsCreating(false)
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={!newProductName.trim() || isCreating}
                        onClick={async () => {
                          if (newProductName.trim() && !isCreating) {
                            setIsCreating(true)
                            await createInstrument(selectedCategoryId, newProductName.trim())
                            setNewProductName('')
                            setIsCreating(false)
                          }
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'var(--income)',
                          color: '#000',
                          fontWeight: 600,
                          cursor: newProductName.trim() ? 'pointer' : 'not-allowed',
                          opacity: newProductName.trim() ? 1 : 0.5
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Provider Selection */}
              {selectedProductId && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'block' }}>
                    3. בחר ספק
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {getProvidersForProduct(selectedProductId).map(prov => (
                      <div key={prov.id} style={{ position: 'relative', display: 'inline-flex' }}>
                        {editingId === `prov-${prov.id}` ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={async () => {
                              if (editingName.trim() && editingName !== prov.name) {
                                await updateProvider(prov.id, { name: editingName.trim() })
                              }
                              setEditingId(null)
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                if (editingName.trim() && editingName !== prov.name) {
                                  await updateProvider(prov.id, { name: editingName.trim() })
                                }
                                setEditingId(null)
                              } else if (e.key === 'Escape') {
                                setEditingId(null)
                              }
                            }}
                            autoFocus
                            style={{
                              padding: '10px 16px',
                              borderRadius: '10px',
                              border: '2px solid #a78bfa',
                              background: 'rgba(167, 139, 250, 0.15)',
                              color: '#fff',
                              fontSize: '0.9rem',
                              width: '120px'
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditMode) {
                                setEditingId(`prov-${prov.id}`)
                                setEditingName(prov.name)
                              } else {
                                setNewItemParentId(prov.id)
                              }
                            }}
                            style={{
                              padding: '10px 16px',
                              paddingLeft: isEditMode ? '28px' : '16px',
                              borderRadius: '10px',
                              border: newItemParentId === prov.id ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)',
                              background: newItemParentId === prov.id ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.03)',
                              color: newItemParentId === prov.id ? '#a78bfa' : '#fff',
                              fontWeight: newItemParentId === prov.id ? 600 : 400,
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            {prov.name}
                          </button>
                        )}
                        {isEditMode && editingId !== `prov-${prov.id}` && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (confirm(`למחוק את "${prov.name}"?`)) {
                                await deleteProvider(prov.id)
                                if (newItemParentId === prov.id) {
                                  setNewItemParentId('')
                                }
                              }
                            }}
                            style={{
                              position: 'absolute',
                              right: '4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: 'none',
                              background: 'rgba(251, 113, 133, 0.3)',
                              color: 'var(--expense)',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {/* Add new provider inline */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="ספק חדש"
                        value={newProviderName}
                        onChange={(e) => setNewProviderName(e.target.value)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px dashed rgba(167, 139, 250, 0.5)',
                          background: 'rgba(255,255,255,0.03)',
                          color: '#fff',
                          fontSize: '0.85rem',
                          width: '120px'
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && newProviderName.trim() && !isCreating) {
                            setIsCreating(true)
                            await createProvider(selectedProductId, newProviderName.trim())
                            setNewProviderName('')
                            setIsCreating(false)
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={!newProviderName.trim() || isCreating}
                        onClick={async () => {
                          if (newProviderName.trim() && !isCreating) {
                            setIsCreating(true)
                            await createProvider(selectedProductId, newProviderName.trim())
                            setNewProviderName('')
                            setIsCreating(false)
                          }
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#a78bfa',
                          color: '#000',
                          fontWeight: 600,
                          cursor: newProviderName.trim() ? 'pointer' : 'not-allowed',
                          opacity: newProviderName.trim() ? 1 : 0.5
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show auto name and options when provider selected */}
              {newItemParentId && (
                <>
                  {/* Auto-generated name */}
                  <div style={{
                    padding: '14px',
                    marginBottom: '12px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>שם הנכס:</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>{getAutoAssetName()}</div>
                  </div>

                  {/* Optional nickname */}
                  <input
                    type="text"
                    placeholder="כינוי מותאם אישית (אופציונלי)"
                    value={newItemNickname}
                    onChange={(e) => setNewItemNickname(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      marginBottom: '12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />

                  {/* Liquid & Currency */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setNewItemIsLiquid(true)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        border: newItemIsLiquid ? '2px solid var(--income)' : '1px solid rgba(255,255,255,0.1)',
                        background: newItemIsLiquid ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: newItemIsLiquid ? 'var(--income)' : 'var(--text-dim)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      נזיל
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemIsLiquid(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        border: !newItemIsLiquid ? '2px solid var(--expense)' : '1px solid rgba(255,255,255,0.1)',
                        background: !newItemIsLiquid ? 'rgba(251, 113, 133, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: !newItemIsLiquid ? 'var(--expense)' : 'var(--text-dim)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      לא נזיל
                    </button>
                  </div>


                  {/* Submit */}
                  <button
                    onClick={handleAddAsset}
                    disabled={isAddingLoading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'var(--accent)',
                      border: 'none',
                      color: '#000',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '1rem',
                      opacity: isAddingLoading ? 0.5 : 1
                    }}
                  >
                    {isAddingLoading ? 'שומר...' : 'הוסף נכס'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Empty state */}
          {!isAddingAsset && isDemo && (
            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              התחבר כדי להוסיף נכסים
            </p>
          )}
        </div>
      )}

      {/* Month picker */}
      <MonthPicker month={month} year={year} onChange={handleMonthChange} />

      {/* Balance summary */}
      {data && (
        <div style={{ marginBottom: '20px' }}>
          <BalanceSummary
            totalBalance={hasActiveFilters ? String(filteredTotal) : data.totalBalance}
            currency={data.totalBalanceCurrency}
            monthlyChange={hasActiveFilters ? { absolute: '0', percentage: 0 } : data.changeFromPrevious}
            isStaleRates={exchangeRates?.isStale}
          />
          {hasActiveFilters && (
            <div style={{
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '0.8rem',
              color: 'var(--text-dim)'
            }}>
              מציג סה&quot;כ מסונן מתוך ₪{formatNumber(Number(data.totalBalance))}
            </div>
          )}
        </div>
      )}

      {/* Quick Filters */}
      <QuickFilters
        assetClasses={assetClasses.map(ac => ({ id: ac.id, name: ac.name }))}
        filters={filters}
        onFilterChange={setFilters}
      />

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

      {/* Loading */}
      {isLoading && !data && (
        <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-dim)' }}>טוען...</p>
          </div>
        </div>
      )}

      {/* Asset Groups */}
      {(!isLoading || data) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredAssetClasses.length === 0 && assetClasses.length > 0 && (
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
                <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>🔍</span>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontWeight: 600 }}>אין תוצאות</h3>
              <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem' }}>נסה לשנות את הפילטרים</p>
            </div>
          )}

          {filteredAssetClasses.length === 0 && assetClasses.length === 0 && (
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
              <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem' }}>עבור לדף &quot;הגדרות&quot; כדי להוסיף נכסים</p>
            </div>
          )}

          {filteredAssetClasses.map((ac) => {
            // Calculate class total
            let classTotal = 0
            ac.instruments.forEach(inst => {
              inst.providers.forEach(prov => {
                prov.assets.forEach(asset => {
                  const valueData = getValueData(asset.id)
                  classTotal += parseFloat(valueData.value || '0')
                })
              })
            })

            const isExpanded = expandedClasses.has(ac.id)
            const assetsCount = ac.instruments.reduce((sum, i) =>
              sum + i.providers.reduce((s, p) => s + p.assets.length, 0), 0)

            return (
              <div key={ac.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Class Header - Level 0 */}
                <button
                  onClick={() => toggleClass(ac.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: isExpanded ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      color: '#38bdf8',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      fontSize: '0.8rem'
                    }}>▶</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#38bdf8' }}>{ac.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {assetsCount} נכסים
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#38bdf8' }} dir="ltr">
                      ₪{formatNumber(classTotal)}
                    </div>
                    {data && Number(data.totalBalance) > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {((classTotal / Number(data.totalBalance)) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </button>

                {/* Expanded Assets */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {ac.instruments.map(inst => (
                      <div key={inst.id}>
                        {/* Instrument/Product Header - Level 1 (indented) - Green like in add form */}
                        <div style={{
                          padding: '10px 20px',
                          paddingRight: '36px',
                          background: 'rgba(74, 222, 128, 0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderBottom: '1px solid rgba(255,255,255,0.03)'
                        }}>
                          <span style={{ color: 'var(--income)', fontSize: '0.7rem' }}>┗</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--income)' }}>{inst.name}</span>
                        </div>
                        {inst.providers.map(prov => (
                          <div key={prov.id}>
                            {/* Provider Header - Level 2 (more indented) - Purple like in add form */}
                            <div style={{
                              padding: '8px 20px',
                              paddingRight: '56px',
                              background: 'rgba(167, 139, 250, 0.03)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              borderBottom: '1px solid rgba(255,255,255,0.02)'
                            }}>
                              <span style={{ color: '#a78bfa', fontSize: '0.6rem' }}>┗</span>
                              <span style={{ fontSize: '0.85rem', color: '#a78bfa' }}>{prov.name}</span>
                            </div>
                            {prov.assets.map(asset => {
                              const valueData = getValueData(asset.id)
                              return (
                                <div
                                  key={asset.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 20px',
                                    paddingRight: '76px',
                                    borderBottom: '1px solid rgba(255,255,255,0.02)'
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <span style={{ color: 'var(--text-dim)', fontSize: '0.5rem' }}>┗</span>
                                      <span style={{ fontSize: '0.9rem' }}>{asset.name}</span>
                                      {asset.isLiquid && (
                                        <span style={{
                                          fontSize: '0.65rem',
                                          color: 'var(--income)',
                                          background: 'rgba(74, 222, 128, 0.1)',
                                          padding: '2px 6px',
                                          borderRadius: '4px'
                                        }}>נזיל</span>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ marginRight: '12px' }}>
                                    <ValueInput
                                      value={valueData.value}
                                      currency={asset.currency}
                                      isInherited={valueData.isInherited}
                                      onChange={(value) => handleValueChange(asset.id, value)}
                                      disabled={isLoading || isDemo}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
