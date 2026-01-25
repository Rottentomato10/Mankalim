'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TreeNode } from './TreeNode'
import { AddItemDialog } from './AddItemDialog'
import { EditItemDialog } from './EditItemDialog'
import { GlassCard } from '@/components/ui/GlassCard'
import type { AssetClass, Instrument, Provider, Asset } from '@/types'

type ItemType = 'assetClass' | 'instrument' | 'provider' | 'asset'

interface AssetClassWithChildren extends AssetClass {
  instruments: (Instrument & {
    providers: (Provider & {
      assets: Asset[]
    })[]
  })[]
}

interface AssetTreeProps {
  assetClasses: AssetClassWithChildren[]
  searchTerm?: string
  disabled?: boolean
  onCreateAssetClass: (name: string) => Promise<AssetClassWithChildren | null>
  onUpdateAssetClass: (id: string, data: { name?: string }) => Promise<void>
  onDeleteAssetClass: (id: string) => Promise<void>
  onCreateInstrument: (assetClassId: string, name: string) => Promise<void>
  onUpdateInstrument: (id: string, data: { name?: string }) => Promise<void>
  onDeleteInstrument: (id: string) => Promise<void>
  onCreateProvider: (instrumentId: string, name: string) => Promise<void>
  onUpdateProvider: (id: string, data: { name?: string }) => Promise<void>
  onDeleteProvider: (id: string) => Promise<void>
  onCreateAsset: (providerId: string, data: { name: string; isLiquid?: boolean; currency?: string; notes?: string }) => Promise<void>
  onUpdateAsset: (id: string, data: { name?: string; isLiquid?: boolean; currency?: string; notes?: string | null }) => Promise<void>
  onDeleteAsset: (id: string) => Promise<void>
  onReorder: (type: ItemType, items: { id: string; displayOrder: number }[]) => Promise<void>
}

interface AddDialogState {
  isOpen: boolean
  type: ItemType
  parentId?: string
  parentName?: string
}

interface EditDialogState {
  isOpen: boolean
  type: ItemType
  id: string
  item: { name: string; isLiquid?: boolean; currency?: string; notes?: string | null } | null
  childCount: number
}

export function AssetTree({
  assetClasses,
  searchTerm = '',
  disabled = false,
  onCreateAssetClass,
  onUpdateAssetClass,
  onDeleteAssetClass,
  onCreateInstrument,
  onUpdateInstrument,
  onDeleteInstrument,
  onCreateProvider,
  onUpdateProvider,
  onDeleteProvider,
  onCreateAsset,
  onUpdateAsset,
  onDeleteAsset,
  onReorder,
}: AssetTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter asset classes based on search term
  const filteredAssetClasses = searchTerm
    ? assetClasses.filter(ac => {
        const search = searchTerm.toLowerCase()
        if (ac.name.toLowerCase().includes(search)) return true
        return ac.instruments.some(inst => {
          if (inst.name.toLowerCase().includes(search)) return true
          return inst.providers.some(prov => {
            if (prov.name.toLowerCase().includes(search)) return true
            return prov.assets?.some(asset => asset.name.toLowerCase().includes(search))
          })
        })
      })
    : assetClasses

  const [addDialog, setAddDialog] = useState<AddDialogState>({
    isOpen: false,
    type: 'assetClass',
  })

  const [editDialog, setEditDialog] = useState<EditDialogState>({
    isOpen: false,
    type: 'assetClass',
    id: '',
    item: null,
    childCount: 0,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const activeData = active.data.current as { type: ItemType; level: number }
    const overData = over.data.current as { type: ItemType; level: number }

    // Only allow reordering within same type and level
    if (activeData.type !== overData.type || activeData.level !== overData.level) return

    const type = activeData.type
    let items: { id: string; displayOrder: number }[] = []

    switch (type) {
      case 'assetClass': {
        const oldIndex = assetClasses.findIndex((ac) => ac.id === active.id)
        const newIndex = assetClasses.findIndex((ac) => ac.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = [...assetClasses]
        const [moved] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, moved)
        items = reordered.map((ac, i) => ({ id: ac.id, displayOrder: i }))
        break
      }
      // Similar logic for other types would go here
    }

    if (items.length > 0) {
      await onReorder(type, items)
    }
  }

  const openAddDialog = (type: ItemType, parentId?: string, parentName?: string) => {
    if (disabled) return
    setAddDialog({ isOpen: true, type, parentId, parentName })
  }

  const closeAddDialog = () => {
    setAddDialog({ isOpen: false, type: 'assetClass' })
  }

  const handleAddSubmit = async (data: { name: string; isLiquid?: boolean; currency?: string; notes?: string }) => {
    setIsLoading(true)
    try {
      switch (addDialog.type) {
        case 'assetClass':
          await onCreateAssetClass(data.name)
          break
        case 'instrument':
          if (addDialog.parentId) await onCreateInstrument(addDialog.parentId, data.name)
          break
        case 'provider':
          if (addDialog.parentId) await onCreateProvider(addDialog.parentId, data.name)
          break
        case 'asset':
          if (addDialog.parentId) await onCreateAsset(addDialog.parentId, data)
          break
      }
      closeAddDialog()
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (
    type: ItemType,
    id: string,
    item: { name: string; isLiquid?: boolean; currency?: string; notes?: string | null },
    childCount: number
  ) => {
    if (disabled) return
    setEditDialog({ isOpen: true, type, id, item, childCount })
  }

  const closeEditDialog = () => {
    setEditDialog({ isOpen: false, type: 'assetClass', id: '', item: null, childCount: 0 })
  }

  const handleEditSubmit = async (data: { name?: string; isLiquid?: boolean; currency?: string; notes?: string | null }) => {
    setIsLoading(true)
    try {
      switch (editDialog.type) {
        case 'assetClass':
          await onUpdateAssetClass(editDialog.id, data)
          break
        case 'instrument':
          await onUpdateInstrument(editDialog.id, data)
          break
        case 'provider':
          await onUpdateProvider(editDialog.id, data)
          break
        case 'asset':
          await onUpdateAsset(editDialog.id, data)
          break
      }
      closeEditDialog()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      switch (editDialog.type) {
        case 'assetClass':
          await onDeleteAssetClass(editDialog.id)
          break
        case 'instrument':
          await onDeleteInstrument(editDialog.id)
          break
        case 'provider':
          await onDeleteProvider(editDialog.id)
          break
        case 'asset':
          await onDeleteAsset(editDialog.id)
          break
      }
      closeEditDialog()
    } finally {
      setIsLoading(false)
    }
  }

  const countChildren = (ac: AssetClassWithChildren) => {
    let count = ac.instruments.length
    for (const inst of ac.instruments) {
      count += inst.providers.length
      for (const prov of inst.providers) {
        count += prov.assets.length
      }
    }
    return count
  }

  if (filteredAssetClasses.length === 0 && !searchTerm) {
    return (
      <GlassCard className="text-center p-8">
        <div className="py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-accent"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-2">אין נכסים עדיין</h3>
          <p className="text-white/50 text-sm mb-6">התחל על ידי יצירת קטגוריה ראשונה</p>
          {!disabled && (
            <button
              onClick={() => openAddDialog('assetClass')}
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent/90 text-background font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              הוסף קטגוריה
            </button>
          )}
        </div>

        <AddItemDialog
          isOpen={addDialog.isOpen}
          onClose={closeAddDialog}
          onSubmit={handleAddSubmit}
          type={addDialog.type}
          parentName={addDialog.parentName}
          isLoading={isLoading}
        />
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add asset class button */}
      {!disabled && (
        <button
          onClick={() => openAddDialog('assetClass')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-glass-border hover:border-accent/50 text-white/50 hover:text-accent transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          הוסף קטגוריה
        </button>
      )}

      {/* No results message */}
      {filteredAssetClasses.length === 0 && searchTerm && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-dim)' }}>
          <p>לא נמצאו תוצאות עבור &quot;{searchTerm}&quot;</p>
        </div>
      )}

      {/* Tree */}
      {filteredAssetClasses.length > 0 && (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <GlassCard variant="small">
          <SortableContext items={filteredAssetClasses.map((ac) => ac.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {filteredAssetClasses.map((ac) => (
                <TreeNode
                  key={ac.id}
                  id={ac.id}
                  type="assetClass"
                  name={ac.name}
                  level={0}
                  isExpanded={expanded.has(ac.id)}
                  onToggle={() => toggleExpanded(ac.id)}
                  onEdit={() => openEditDialog('assetClass', ac.id, { name: ac.name }, countChildren(ac))}
                  onAdd={() => openAddDialog('instrument', ac.id, ac.name)}
                  hasChildren={ac.instruments.length > 0}
                >
                  {ac.instruments.map((inst) => (
                    <TreeNode
                      key={inst.id}
                      id={inst.id}
                      type="instrument"
                      name={inst.name}
                      level={1}
                      isExpanded={expanded.has(inst.id)}
                      onToggle={() => toggleExpanded(inst.id)}
                      onEdit={() =>
                        openEditDialog(
                          'instrument',
                          inst.id,
                          { name: inst.name },
                          inst.providers.length + inst.providers.reduce((acc, p) => acc + (p.assets?.length || 0), 0)
                        )
                      }
                      onAdd={() => openAddDialog('provider', inst.id, inst.name)}
                      hasChildren={inst.providers.length > 0}
                    >
                      {inst.providers.map((prov) => (
                        <TreeNode
                          key={prov.id}
                          id={prov.id}
                          type="provider"
                          name={prov.name}
                          level={2}
                          isExpanded={expanded.has(prov.id)}
                          onToggle={() => toggleExpanded(prov.id)}
                          onEdit={() => openEditDialog('provider', prov.id, { name: prov.name }, prov.assets?.length || 0)}
                          onAdd={() => openAddDialog('asset', prov.id, prov.name)}
                          hasChildren={(prov.assets?.length || 0) > 0}
                        >
                          {prov.assets?.map((asset) => (
                            <TreeNode
                              key={asset.id}
                              id={asset.id}
                              type="asset"
                              name={asset.name}
                              level={3}
                              onEdit={() =>
                                openEditDialog('asset', asset.id, {
                                  name: asset.name,
                                  isLiquid: asset.isLiquid,
                                  currency: asset.currency,
                                  notes: asset.notes,
                                }, 0)
                              }
                              badge={asset.currency}
                              subtitle={asset.isLiquid ? 'נזיל' : undefined}
                            />
                          ))}
                        </TreeNode>
                      ))}
                    </TreeNode>
                  ))}
                </TreeNode>
              ))}
            </div>
          </SortableContext>
        </GlassCard>

        <DragOverlay>
          {activeId ? (
            <div className="py-2.5 px-3 rounded-xl bg-accent/20 border border-accent text-white">
              גורר...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      )}

      {/* Dialogs */}
      <AddItemDialog
        isOpen={addDialog.isOpen}
        onClose={closeAddDialog}
        onSubmit={handleAddSubmit}
        type={addDialog.type}
        parentName={addDialog.parentName}
        isLoading={isLoading}
      />

      <EditItemDialog
        isOpen={editDialog.isOpen}
        onClose={closeEditDialog}
        onSubmit={handleEditSubmit}
        onDelete={handleDelete}
        type={editDialog.type}
        item={editDialog.item}
        isLoading={isLoading}
        childCount={editDialog.childCount}
      />
    </div>
  )
}

export default AssetTree
