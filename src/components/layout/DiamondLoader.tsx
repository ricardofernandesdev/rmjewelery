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
  const showTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Intercept internal link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // If any inner handler already called preventDefault (e.g. a button
      // inside a card Link that should not navigate) — skip the loader.
      if (e.defaultPrevented) return

      const target = e.target as HTMLElement
      // Skip if the click originated on a button (or inside one) — buttons
      // that exist inside Link wrappers should never trigger navigation UI.
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

      // Delay showing slightly so instant navigations don't flash
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      showTimerRef.current = setTimeout(() => setVisible(true), 150)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Hide on navigation complete
  useEffect(() => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
    if (visible) {
      hideTimerRef.current = setTimeout(() => setVisible(false), 200)
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
      style={{ background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => e.preventDefault()}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 100 100" className="diamond-loader-svg">
          {/* Flat line-art diamond — static, no animation */}
          <g
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <polygon points="50,10 20,40 50,90 80,40" />
            <line x1="20" y1="40" x2="80" y2="40" />
            <line x1="35" y1="25" x2="50" y2="40" />
            <line x1="65" y1="25" x2="50" y2="40" />
            <line x1="35" y1="40" x2="50" y2="90" />
            <line x1="65" y1="40" x2="50" y2="90" />
          </g>
        </svg>

        {/* Sparkles around — the only moving parts */}
        <span className="sparkle sparkle-1">✦</span>
        <span className="sparkle sparkle-2">✦</span>
        <span className="sparkle sparkle-3">✦</span>
        <span className="sparkle sparkle-4">✦</span>
        <span className="sparkle sparkle-5">✦</span>
      </div>

      <style jsx>{`
        .diamond-loader-svg {
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25));
        }
        .sparkle {
          position: absolute;
          color: #0a0a0a;
          font-size: 14px;
          pointer-events: none;
          opacity: 0;
          animation: sparkle-fade 1.8s ease-in-out infinite;
        }
        .sparkle-1 {
          top: -14px;
          left: -14px;
          animation-delay: 0s;
        }
        .sparkle-2 {
          top: 45%;
          right: -18px;
          animation-delay: 0.4s;
          font-size: 12px;
        }
        .sparkle-3 {
          bottom: -14px;
          left: 35%;
          animation-delay: 0.8s;
          font-size: 16px;
        }
        .sparkle-4 {
          top: -10px;
          right: 20%;
          animation-delay: 1.2s;
          font-size: 11px;
        }
        .sparkle-5 {
          top: 55%;
          left: -18px;
          animation-delay: 1.5s;
          font-size: 13px;
        }
        @keyframes sparkle-fade {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
