'use client'

import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  const confirmButtonClasses =
    variant === 'danger'
      ? 'bg-error hover:bg-error/90 text-white'
      : 'bg-accent hover:bg-accent/90 text-background'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-background border border-glass-border rounded-2xl shadow-xl shadow-black/30 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-6 space-y-4">
          {/* Title */}
          <h2 className="text-lg font-semibold text-white">{title}</h2>

          {/* Message */}
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClasses}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>מעבד...</span>
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
