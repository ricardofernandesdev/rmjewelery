'use client'
import React, { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'

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
  products: Product[]
}

export const FeaturedProductsGallery: React.FC<Props> = ({ eyebrow, title, products }) => {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollerRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const getImg = (p: Product) => {
    const first = p.images?.[0]
    if (first && typeof first === 'object') {
      return first.sizes?.card?.url || first.url || null
    }
    return null
  }

  if (!products.length) return null

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

          {/* Scroll buttons */}
          <div className="flex gap-2">
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
      </Container>

      {/* Horizontal scroller */}
      <Container>
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 scrollbar-hide"
        >
        {products.map((product) => {
          const imgUrl = getImg(product)
          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group shrink-0 w-64 md:w-80 snap-start"
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
              {typeof product.price === 'number' && product.price > 0 && (
                <p className="text-sm font-medium text-brand-dark mt-1">
                  {product.price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </p>
              )}
            </Link>
          )
        })}
        </div>
      </Container>
    </section>
  )
}
