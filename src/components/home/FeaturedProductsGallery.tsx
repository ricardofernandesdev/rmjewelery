'use client'
import React, { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { formatPrice } from '@/lib/formatPrice'

type Product = {
  id: string | number
  name: string
  slug: string
  price?: number
  images?: any[]
}

type Props = {
  eyebrow?: string
  title?: string
  count?: number
}

export const FeaturedProductsGallery: React.FC<Props> = ({ eyebrow, title, count = 10 }) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch(`/api/products?limit=50&depth=1`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const docs: Product[] = data?.docs || []
        // Shuffle randomly
        const shuffled = docs.sort(() => Math.random() - 0.5)
        setProducts(shuffled.slice(0, count))
      })
      .catch(() => {})
  }, [count])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollerRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const getImg = (p: Product) => {
    const first = p.images?.[0]
    if (first && typeof first === 'object') {
      return (first as any).sizes?.card?.url || (first as any).url || null
    }
    return null
  }

  if (products.length === 0) return null

  return (
    <section className="py-20 md:py-28 bg-white">
      <Container>
        <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
          <div>
            {eyebrow && (
              <p className="text-[10px] tracking-[0.3em] text-brand-gray uppercase mb-3">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-heading italic text-4xl md:text-5xl text-brand-dark font-light leading-tight">
                {title}
              </h2>
            )}
          </div>

          {/* Arrows hidden on mobile where we use a grid layout */}
          <div className="hidden md:flex gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Anterior"
              className="w-10 h-10 border border-brand-dark/20 text-brand-dark hover:bg-brand-dark hover:text-white transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Seguinte"
              className="w-10 h-10 border border-brand-dark/20 text-brand-dark hover:bg-brand-dark hover:text-white transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="grid grid-cols-2 gap-4 md:flex md:gap-6 md:overflow-x-auto md:scroll-smooth md:snap-x md:snap-mandatory md:pb-3 scrollbar-hide"
        >
          {products.map((product) => {
            const imgUrl = getImg(product)
            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group w-full md:shrink-0 md:w-80 md:snap-start"
              >
                <div className="relative aspect-square bg-white border border-gray-100 overflow-hidden mb-4">
                  {imgUrl && (
                    <Image
                      src={imgUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 256px, 320px"
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <h3 className="font-heading text-lg text-brand-dark">{product.name}</h3>
                <p className="text-sm font-medium text-brand-dark mt-1">
                  {formatPrice(product.price)}
                </p>
              </Link>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
