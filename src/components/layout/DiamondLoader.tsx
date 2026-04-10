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
      const target = e.target as HTMLElement
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
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{ background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(2px)' }}
    >
      <div className="relative">
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          className="diamond-loader-svg"
        >
          {/* Flat line-art diamond */}
          <g
            className="diamond-rotate"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {/* Outer outline */}
            <polygon points="50,10 20,40 50,90 80,40" />
            {/* Girdle (horizontal crown line) */}
            <line x1="20" y1="40" x2="80" y2="40" />
            {/* Crown facets */}
            <line x1="35" y1="25" x2="50" y2="40" />
            <line x1="65" y1="25" x2="50" y2="40" />
            {/* Pavilion facets */}
            <line x1="35" y1="40" x2="50" y2="90" />
            <line x1="65" y1="40" x2="50" y2="90" />
          </g>
        </svg>

        {/* Sparkles around */}
        <span className="sparkle sparkle-1">✦</span>
        <span className="sparkle sparkle-2">✦</span>
        <span className="sparkle sparkle-3">✦</span>
      </div>

      <style jsx>{`
        .diamond-loader-svg {
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25));
          animation: diamond-pulse 1.4s ease-in-out infinite;
        }
        .diamond-rotate {
          transform-origin: 50px 50px;
          animation: diamond-spin 2.5s linear infinite;
        }
        @keyframes diamond-spin {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        @keyframes diamond-pulse {
          0%, 100% {
            filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.2));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.35));
            transform: scale(1.05);
          }
        }
        .sparkle {
          position: absolute;
          color: #0a0a0a;
          font-size: 14px;
          pointer-events: none;
          opacity: 0;
          animation: sparkle-fade 1.8s ease-in-out infinite;
          text-shadow: none;
        }
        .sparkle-1 {
          top: -12px;
          left: -12px;
          animation-delay: 0s;
        }
        .sparkle-2 {
          top: 50%;
          right: -16px;
          animation-delay: 0.6s;
          font-size: 12px;
        }
        .sparkle-3 {
          bottom: -12px;
          left: 30%;
          animation-delay: 1.2s;
          font-size: 16px;
        }
        @keyframes sparkle-fade {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
