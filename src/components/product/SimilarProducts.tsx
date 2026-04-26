'use client'
import React, { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/formatPrice'

type SimpleProduct = {
  id: string | number
  name: string
  slug: string
  price?: number
  imageUrl?: string | null
  imageAlt?: string
}

type Props = {
  products: SimpleProduct[]
}

export const SimilarProducts: React.FC<Props> = ({ products }) => {
  const scrollerRef = useRef<HTMLDivElement>(null)

  if (products.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  return (
    <section className="mt-16 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading italic text-2xl md:text-3xl text-brand-dark font-light">
          Produtos Semelhantes
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Anterior"
            className="w-9 h-9 border border-brand-dark/20 text-brand-dark hover:bg-brand-dark hover:text-white transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Seguinte"
            className="w-9 h-9 border border-brand-dark/20 text-brand-dark hover:bg-brand-dark hover:text-white transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 scrollbar-hide"
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group shrink-0 w-48 md:w-56 snap-start"
          >
            <div className="relative aspect-square bg-white border border-gray-100 overflow-hidden mb-3">
              {product.imageUrl && (
                <Image
                  src={product.imageUrl}
                  alt={product.imageAlt || product.name}
                  fill
                  sizes="224px"
                  className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                />
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-wider text-brand-dark">RM</span>
            </div>
            <h3 className="text-sm text-brand-dark leading-snug mb-1">{product.name}</h3>
            <p className="text-sm font-medium text-brand-dark">
              {formatPrice(product.price)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
