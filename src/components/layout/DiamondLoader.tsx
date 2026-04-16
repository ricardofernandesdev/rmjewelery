'use client'
import React, { useEffect, useState, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export const DiamondLoader: React.FC = () => (
  <Suspense fallback={null}>
    <DiamondLoaderInner />
  </Suspense>
)

const DiamondLoaderInner: React.FC = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button')) return

      const anchor = target.closest('a') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target === '_blank') return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (e.button !== 0) return

      const href = anchor.getAttribute('href')
      if (!href) return
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return

      try {
        const url = new URL(anchor.href, window.location.href)
        if (url.pathname === window.location.pathname && url.search === window.location.search) return
      } catch {
        return
      }

      setVisible(true)
    }

    // Capture phase fires before <Link>'s own handler calls preventDefault()
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  useEffect(() => {
    if (visible) {
      hideTimerRef.current = setTimeout(() => setVisible(false), 250)
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => e.preventDefault()}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="diamond-wrap">
        <svg width="120" height="120" viewBox="0 0 100 100" className="diamond-svg">
          <defs>
            <linearGradient id="dl-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a0a0a" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#0a0a0a" stopOpacity="1" />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Faint static facets — give the diamond depth while the outline spins */}
          <g
            fill="none"
            stroke="#0a0a0a"
            strokeOpacity="0.18"
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <line x1="20" y1="40" x2="80" y2="40" />
            <line x1="35" y1="25" x2="50" y2="40" />
            <line x1="65" y1="25" x2="50" y2="40" />
            <line x1="35" y1="40" x2="50" y2="90" />
            <line x1="65" y1="40" x2="50" y2="90" />
          </g>

          {/* Spinning outline — strokeDasharray creates the chasing arc */}
          <polygon
            className="diamond-outline"
            points="50,10 20,40 50,90 80,40"
            fill="none"
            stroke="url(#dl-stroke)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <style jsx>{`
        .diamond-wrap {
          filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.18));
        }
        .diamond-svg {
          animation: dl-spin 1.6s linear infinite;
          transform-origin: center;
        }
        .diamond-outline {
          stroke-dasharray: 60 220;
          stroke-dashoffset: 0;
          animation: dl-trace 1.6s linear infinite;
        }
        @keyframes dl-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes dl-trace {
          to {
            stroke-dashoffset: -280;
          }
        }
      `}</style>
    </div>
  )
}
