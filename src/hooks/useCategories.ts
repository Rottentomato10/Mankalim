'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Category {
  id: string
  name: string
  displayOrder: number
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const addCategory = async (name: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) throw new Error('Failed to add category')
      await fetchCategories()
      return true
    } catch {
      return false
    }
  }

  const updateCategory = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) throw new Error('Failed to update category')
      await fetchCategories()
      return true
    } catch {
      return false
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete category')
      await fetchCategories()
      return true
    } catch {
      return false
    }
  }

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  }
}
