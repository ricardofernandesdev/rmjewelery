import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getSiteSettings } from '@/lib/queries'

export default async function HomePage() {
  const settings = await getSiteSettings().catch(() => null)
  const hero =
    settings?.heroImage && typeof settings.heroImage === 'object'
      ? (settings.heroImage as any)
      : null
  const heroUrl = hero?.url || null
  const heroAlt = hero?.alt || 'RM Jewelry'
  const heroTitle = (settings as any)?.heroTitle || 'Explore os nossos produtos'
  const heroButtonLabel = (settings as any)?.heroButtonLabel || 'VER CATÁLOGO COMPLETO'

  return (
    <section className="relative w-full h-[400px] md:h-[500px] bg-brand-dark overflow-hidden">
      {heroUrl && (
        <Image
          src={heroUrl}
          alt={heroAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      )}

      {/* Subtle dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Centered content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-heading text-white text-3xl md:text-5xl lg:text-6xl font-light tracking-wide mb-10 drop-shadow-md">
          {heroTitle}
        </h1>
        <Link
          href="/products"
          className="inline-flex items-center justify-center border border-white/80 text-white text-xs md:text-sm tracking-[0.2em] uppercase px-8 md:px-10 py-3 md:py-4 hover:bg-white hover:text-brand-dark transition-colors"
        >
          {heroButtonLabel}
        </Link>
      </div>
    </section>
  )
}
