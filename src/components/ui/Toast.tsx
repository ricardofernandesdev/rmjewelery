'use client'
import React, { useEffect, useState, useCallback } from 'react'

type ToastVariant = 'success' | 'info' | 'error'

type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
}

type ShowToastDetail = {
  message: string
  variant?: ToastVariant
  duration?: number
}

/** Dispatch a global toast event from anywhere in the client tree. */
export function showToast(message: string, variant: ToastVariant = 'success', duration = 2500) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<ShowToastDetail>('show-toast', {
      detail: { message, variant, duration },
    }),
  )
}

export const Toast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ShowToastDetail>).detail
      if (!detail?.message) return
      const id = Date.now() + Math.random()
      const item: ToastItem = {
        id,
        message: detail.message,
        variant: detail.variant || 'success',
      }
      setToasts((prev) => [...prev, item])
      const duration = detail.duration ?? 2500
      setTimeout(() => remove(id), duration)
    }
    window.addEventListener('show-toast', handler)
    return () => window.removeEventListener('show-toast', handler)
  }, [remove])

  if (toasts.length === 0) return null

  const variantClasses: Record<ToastVariant, string> = {
    success: 'bg-brand-dark text-white border-brand-dark',
    info: 'bg-white text-brand-dark border-gray-200',
    error: 'bg-red-600 text-white border-red-700',
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3 border shadow-lg text-sm tracking-wide animate-toast-in ${variantClasses[t.variant]}`}
        >
          {t.variant === 'success' && (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <span>{t.message}</span>
        </div>
      ))}

      <style jsx>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-toast-in {
          animation: toast-in 0.25s ease-out;
        }
      `}</style>
    </div>
  )
}
