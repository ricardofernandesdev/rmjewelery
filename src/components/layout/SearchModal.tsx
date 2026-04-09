'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Product = {
  id: string | number
  name: string
  slug: string
  images?: any[]
}

type Props = {
  triggerClassName?: string
}

export const SearchModal: React.FC<Props> = ({ triggerClassName = '' }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
    }
  }, [open])

  // Close on ESC
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          'where[name][like]': trimmed,
          limit: '8',
          depth: '1',
        })
        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()
        setResults(data?.docs || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const getImageUrl = (product: Product): string | null => {
    const first = product.images?.[0]
    if (first && typeof first === 'object') {
      return first.sizes?.thumbnail?.url || first.url || null
    }
    return null
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Procurar"
        className={triggerClassName}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24 md:pt-32"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center border-b border-gray-200 px-5 py-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" className="text-brand-gray shrink-0">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procurar produtos..."
                className="flex-1 ml-3 bg-transparent outline-none text-brand-dark placeholder-brand-gray text-sm"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-3 text-brand-gray hover:text-brand-dark text-xs tracking-wider uppercase"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="px-5 py-6 text-center text-xs text-brand-gray tracking-wider uppercase">
                  A procurar...
                </div>
              )}
              {!loading && query && results.length === 0 && (
                <div className="px-5 py-6 text-center text-xs text-brand-gray tracking-wider uppercase">
                  Nenhum resultado para "{query}"
                </div>
              )}
              {!loading && !query && (
                <div className="px-5 py-6 text-center text-xs text-brand-gray tracking-wider uppercase">
                  Escreve para procurar produtos
                </div>
              )}
              {!loading && results.length > 0 && (
                <ul>
                  {results.map((product) => {
                    const imgUrl = getImageUrl(product)
                    return (
                      <li key={product.id}>
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-4 px-5 py-3 hover:bg-brand-cream/40 transition-colors"
                        >
                          <div className="w-12 h-12 bg-brand-cream rounded overflow-hidden shrink-0 relative">
                            {imgUrl && (
                              <Image
                                src={imgUrl}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <span className="text-sm text-brand-dark">{product.name}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
