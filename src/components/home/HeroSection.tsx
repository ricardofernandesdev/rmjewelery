'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Props = {
  imageUrl: string | null
  imageAlt: string
  showEyebrow: boolean
  eyebrow: string
  title: string
  showPrimary: boolean
  primaryLabel: string
  primaryLink: string
  showSecondary: boolean
  secondaryLabel: string
  secondaryLink: string
}

export const HeroSection: React.FC<Props> = ({
  imageUrl,
  imageAlt,
  showEyebrow,
  eyebrow,
  title,
  showPrimary,
  primaryLabel,
  primaryLink,
  showSecondary,
  secondaryLabel,
  secondaryLink,
}) => {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Progress 0..1 across the hero height (640px)
  const progress = Math.min(Math.max(scrollY / 640, 0), 1)

  return (
    <section className="relative w-full h-[500px] md:h-[640px] bg-brand-dark overflow-hidden">
      {/* Background image — parallax + scale down */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translateY(${scrollY * 0.4}px) scale(${1 + progress * 0.1})`,
        }}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        )}
      </div>

      {/* Overlay — darkens progressively */}
      <div
        className="absolute inset-0 bg-black transition-opacity"
        style={{ opacity: 0.4 + progress * 0.3 }}
      />

      {/* Content — fades out and moves up */}
      <div
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 will-change-transform"
        style={{
          transform: `translateY(${scrollY * 0.6}px)`,
          opacity: Math.max(1 - progress * 1.4, 0),
        }}
      >
        {showEyebrow && (
          <p className="text-[10px] md:text-xs tracking-[0.3em] text-white/80 uppercase mb-5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading italic text-white text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05] mb-10 max-w-4xl">
          {title}
        </h1>
        {(showPrimary || showSecondary) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {showPrimary && (
              <Link
                href={primaryLink}
                className="inline-flex items-center justify-center border border-white/80 text-white text-[11px] tracking-[0.22em] uppercase px-7 py-3 hover:bg-white hover:text-brand-dark transition-colors"
              >
                {primaryLabel}
              </Link>
            )}
            {showSecondary && (
              <Link
                href={secondaryLink}
                className="inline-flex items-center justify-center bg-white text-brand-dark text-[11px] tracking-[0.22em] uppercase px-7 py-3 hover:bg-white/90 transition-colors"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
