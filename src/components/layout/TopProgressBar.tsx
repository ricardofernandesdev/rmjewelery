'use client'
import React, { useEffect, useState, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export const TopProgressBar: React.FC = () => (
  <Suspense fallback={null}>
    <TopProgressBarInner />
  </Suspense>
)

const TopProgressBarInner: React.FC = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Intercept clicks on internal links to start the bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target === '_blank') return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (e.button !== 0) return

      const href = anchor.getAttribute('href')
      if (!href) return
      // Only internal links
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (href.startsWith('#')) return

      // Skip if it's the same URL
      try {
        const url = new URL(anchor.href, window.location.href)
        if (url.pathname === window.location.pathname && url.search === window.location.search) return
      } catch {
        return
      }

      startProgress()
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const startProgress = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (timerRef.current) clearInterval(timerRef.current)

    setVisible(true)
    setProgress(10)

    // Simulate progress up to 90% while page loads
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          if (timerRef.current) clearInterval(timerRef.current)
          return p
        }
        return p + Math.random() * 10
      })
    }, 200)
  }

  // When pathname changes, finish the progress
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (visible) {
      setProgress(100)
      hideTimerRef.current = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(to right, #d4a853, #C9A961, #d4a853)',
          boxShadow: '0 0 8px rgba(212, 168, 83, 0.6)',
          transition: 'width 0.2s ease-out',
        }}
      />
    </div>
  )
}
