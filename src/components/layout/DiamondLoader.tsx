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
      <div className="diamond-stage">
        <svg width="140" height="140" viewBox="0 0 100 110" className="diamond-svg">
          <defs>
            {/* Crown — upper facets, lit from upper-left */}
            <linearGradient id="dl-crown-l" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5f5f5" />
              <stop offset="100%" stopColor="#9a9a9a" />
            </linearGradient>
            <linearGradient id="dl-crown-r" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9a9a9a" />
              <stop offset="100%" stopColor="#4d4d4d" />
            </linearGradient>

            {/* Pavilion — lower facets, deeper shadows */}
            <linearGradient id="dl-pav-l" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7a7a7a" />
              <stop offset="100%" stopColor="#2a2a2a" />
            </linearGradient>
            <linearGradient id="dl-pav-r" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5a5a5a" />
              <stop offset="100%" stopColor="#0f0f0f" />
            </linearGradient>

            {/* Table — top flat */}
            <linearGradient id="dl-table" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#cfcfcf" />
            </linearGradient>
          </defs>

          {/* Pavilion (bottom triangles, drawn first so crown sits on top) */}
          <polygon points="3,45 50,45 50,105" fill="url(#dl-pav-l)" />
          <polygon points="50,45 97,45 50,105" fill="url(#dl-pav-r)" />

          {/* Crown (top trapezoidal halves) */}
          <polygon points="10,18 50,18 50,45 3,45" fill="url(#dl-crown-l)" />
          <polygon points="50,18 90,18 97,45 50,45" fill="url(#dl-crown-r)" />

          {/* Table highlight (top flat) */}
          <polygon points="10,18 90,18 50,18" fill="url(#dl-table)" opacity="0.9" />

          {/* Facet outlines for crispness */}
          <g fill="none" stroke="#0a0a0a" strokeWidth="1.2" strokeLinejoin="round">
            <polygon points="10,18 90,18 97,45 50,105 3,45" />
            <line x1="50" y1="18" x2="50" y2="105" />
            <line x1="3" y1="45" x2="97" y2="45" />
          </g>
        </svg>
      </div>

      <style jsx>{`
        .diamond-stage {
          perspective: 900px;
          perspective-origin: 50% 50%;
        }
        .diamond-svg {
          transform-style: preserve-3d;
          transform-origin: 50% 50%;
          animation: dl-spin-y 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.35));
        }
        @keyframes dl-spin-y {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
      `}</style>
    </div>
  )
}
