'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AssetClass, Instrument, Provider, Asset } from '@/types'

interface AssetClassWithChildren extends AssetClass {
  instruments: (Instrument & {
    providers: (Provider & {
      assets: Asset[]
    })[]
  })[]
}

interface UseAssetsReturn {
  assetClasses: AssetClassWithChildren[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createAssetClass: (name: string) => Promise<AssetClassWithChildren | null>
  updateAssetClass: (id: string, data: { name?: string }) => Promise<void>
  deleteAssetClass: (id: string) => Promise<void>
  createInstrument: (assetClassId: string, name: string) => Promise<void>
  updateInstrument: (id: string, data: { name?: string }) => Promise<void>
  deleteInstrument: (id: string) => Promise<void>
  createProvider: (instrumentId: string, name: string) => Promise<void>
  updateProvider: (id: string, data: { name?: string }) => Promise<void>
  deleteProvider: (id: string) => Promise<void>
  createAsset: (providerId: string, data: { name: string; isLiquid?: boolean; currency?: string; notes?: string }) => Promise<void>
  updateAsset: (id: string, data: { name?: string; isLiquid?: boolean; currency?: string; notes?: string | null }) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  reorder: (type: 'assetClass' | 'instrument' | 'provider' | 'asset', items: { id: string; displayOrder: number }[]) => Promise<void>
}

export function useAssets(): UseAssetsReturn {
  const [assetClasses, setAssetClasses] = useState<AssetClassWithChildren[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssets = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/assets/classes')
      if (!response.ok) throw new Error('Failed to fetch assets')
      const data = await response.json()
      setAssetClasses(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const createAssetClass = async (name: string) => {
    try {
      const response = await fetch('/api/assets/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create asset class')
      }
      const newAssetClass = await response.json()
      setAssetClasses((prev) => [...prev, newAssetClass])
      return newAssetClass
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    }
  }

  const updateAssetClass = async (id: string, data: { name?: string }) => {
    try {
      const response = await fetch(`/api/assets/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update asset class')
      await fetchAssets() // Refetch to get full nested structure
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      throw e // Re-throw so UI can handle it
    }
  }

  const deleteAssetClass = async (id: string) => {
    try {
      const response = await fetch(`/api/assets/classes/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete asset class')
      setAssetClasses((prev) => prev.filter((ac) => ac.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const createInstrument = async (assetClassId: string, name: string) => {
    try {
      const response = await fetch('/api/assets/instruments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetClassId, name }),
      })
      if (!response.ok) throw new Error('Failed to create instrument')
      await fetchAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const updateInstrument = async (id: string, data: { name?: string }) => {
    try {
      const response = await fetch(`/api/assets/instruments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update instrument')
      await fetchAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const deleteInstrument = async (id: string) => {
    try {
      const response = await fetch(`/api/assets/instruments/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete instrument')
      await fetchAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const createProvider = async (instrumentId: string, name: string) => {
    try {
      const response = await fetch('/api/assets/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrumentId, name }),
      })
      if (!response.ok) throw new Error('Failed to create provider')
      await fetchAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const updateProvider = async (id: string, data: { name?: string }) => {
    try {
      const response = await fetch(`/api/assets/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update provider')
      await fetchAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const deleteProvider = async (id: string) => {
    try {
      const response = await fetch(`/api/assets/providers/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete provider')
      await fetchAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const createAsset = async (providerId: string, data: { name: string; isLiquid?: boolean; currency?: string; notes?: string }) => {
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, ...data }),
      })
      if (!response.ok) throw new Error('Failed to create asset')
      await fetchAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const updateAsset = async (id: string, data: { name?: string; isLiquid?: boolean; currency?: string; notes?: string | null }) => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update asset')
      await fetchAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const deleteAsset = async (id: string) => {
    try {
      const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete asset')
      await fetchAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const reorder = async (type: 'assetClass' | 'instrument' | 'provider' | 'asset', items: { id: string; displayOrder: number }[]) => {
    try {
      const response = await fetch('/api/assets/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, items }),
      })
      if (!response.ok) throw new Error('Failed to reorder')
      await fetchAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  return {
    assetClasses,
    isLoading,
    error,
    refetch: fetchAssets,
    createAssetClass,
    updateAssetClass,
    deleteAssetClass,
    createInstrument,
    updateInstrument,
    deleteInstrument,
    createProvider,
    updateProvider,
    deleteProvider,
    createAsset,
    updateAsset,
    deleteAsset,
    reorder,
  }
}

export default useAssets
