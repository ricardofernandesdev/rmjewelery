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
      style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative">
        <svg
          width="72"
          height="72"
          viewBox="0 0 100 100"
          className="diamond-loader-svg"
        >
          <defs>
            <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5E6C8" />
              <stop offset="30%" stopColor="#D4AF37" />
              <stop offset="60%" stopColor="#C9A961" />
              <stop offset="100%" stopColor="#8B6914" />
            </linearGradient>
            <linearGradient id="diamondGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Main diamond shape */}
          <g className="diamond-rotate">
            {/* Top crown */}
            <polygon
              points="50,10 20,40 50,35 80,40"
              fill="url(#diamondGrad)"
              stroke="#8B6914"
              strokeWidth="0.5"
            />
            {/* Left facet */}
            <polygon
              points="20,40 50,35 35,50"
              fill="url(#diamondGradLight)"
              stroke="#8B6914"
              strokeWidth="0.5"
            />
            {/* Right facet */}
            <polygon
              points="80,40 50,35 65,50"
              fill="url(#diamondGrad)"
              stroke="#8B6914"
              strokeWidth="0.5"
            />
            {/* Center facet */}
            <polygon
              points="35,50 50,35 65,50"
              fill="url(#diamondGradLight)"
              stroke="#8B6914"
              strokeWidth="0.5"
            />
            {/* Pavilion (bottom) */}
            <polygon
              points="20,40 35,50 50,90"
              fill="url(#diamondGrad)"
              stroke="#8B6914"
              strokeWidth="0.5"
            />
            <polygon
              points="35,50 65,50 50,90"
              fill="url(#diamondGradLight)"
              stroke="#8B6914"
              strokeWidth="0.5"
            />
            <polygon
              points="65,50 80,40 50,90"
              fill="url(#diamondGrad)"
              stroke="#8B6914"
              strokeWidth="0.5"
            />
          </g>
        </svg>

        {/* Sparkles around */}
        <span className="sparkle sparkle-1">✦</span>
        <span className="sparkle sparkle-2">✦</span>
        <span className="sparkle sparkle-3">✦</span>
      </div>

      <style jsx>{`
        .diamond-loader-svg {
          filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.6));
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
            filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.4));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.8));
            transform: scale(1.05);
          }
        }
        .sparkle {
          position: absolute;
          color: #D4AF37;
          font-size: 12px;
          pointer-events: none;
          opacity: 0;
          animation: sparkle-fade 1.8s ease-in-out infinite;
          text-shadow: 0 0 6px rgba(212, 175, 55, 0.8);
        }
        .sparkle-1 {
          top: -8px;
          left: -8px;
          animation-delay: 0s;
        }
        .sparkle-2 {
          top: 50%;
          right: -12px;
          animation-delay: 0.6s;
          font-size: 10px;
        }
        .sparkle-3 {
          bottom: -8px;
          left: 30%;
          animation-delay: 1.2s;
          font-size: 14px;
        }
        @keyframes sparkle-fade {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
