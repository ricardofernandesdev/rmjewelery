'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { removeFromWishlist } from './WishlistButton'

type WishlistItem = {
  id: string | number
  name: string
  slug: string
  price?: number
  imageUrl?: string | null
}

const STORAGE_KEY = 'rm-wishlist'

export const WishlistClient: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = () => {
      try {
        const list: WishlistItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        setItems(list)
      } catch {
        setItems([])
      }
      setLoaded(true)
    }
    load()
    window.addEventListener('wishlist-change', load)
    return () => window.removeEventListener('wishlist-change', load)
  }, [])

  if (!loaded) return null

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto text-brand-gray/50 mb-6"
        >
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        <p className="text-brand-gray mb-6">
          Ainda não tens favoritos. Explora o catálogo e clica no coração nos produtos que gostas.
        </p>
        <Link
          href="/products"
          className="inline-block bg-brand-dark text-white px-8 py-3 text-sm tracking-wider uppercase hover:bg-brand-dark/90 transition-colors"
        >
          Ver Catálogo
        </Link>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-brand-gray text-center mb-8">
        {items.length} {items.length === 1 ? 'peça favorita' : 'peças favoritas'}
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.id} className="relative group">
            <button
              type="button"
              onClick={() => removeFromWishlist(item.id)}
              aria-label="Remover dos favoritos"
              title="Remover"
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-brand-dark hover:text-red-500 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            <Link href={`/products/${item.slug}`} className="block">
              <div className="relative aspect-square bg-white border border-gray-100 overflow-hidden">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="flex items-center gap-2 mt-3 mb-1">
                <span className="text-[10px] font-bold tracking-wider text-brand-dark">RM</span>
              </div>
              <h3 className="text-sm text-brand-dark leading-snug mb-1">{item.name}</h3>
              {typeof item.price === 'number' && (
                <p className="text-sm font-medium text-brand-dark">
                  {item.price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </p>
              )}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
