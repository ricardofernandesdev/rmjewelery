'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ProductCard } from './ProductCard'
import type { Product } from '../../../payload-types'

type SortOption = 'sortOrder' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'
type AvailFilter = 'all' | 'in_stock' | 'out_of_stock'
type GridCols = 4 | 5

type Props = {
  initialProducts: Product[]
  initialTotalDocs: number
  initialHasMore: boolean
  categoryName: string
  categorySlug: string
  pageSize: number
  priceMin: number
  priceMax: number
}

type FetchResult = {
  docs: Product[]
  totalDocs: number
  hasNextPage: boolean
}

export const CategoryPageClient: React.FC<Props> = ({
  initialProducts,
  initialTotalDocs,
  initialHasMore,
  categoryName,
  categorySlug,
  pageSize,
  priceMin,
  priceMax,
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [totalDocs, setTotalDocs] = useState(initialTotalDocs)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [availability, setAvailability] = useState<AvailFilter>('all')
  const [availOpen, setAvailOpen] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([priceMin, priceMax])
  const [priceDraft, setPriceDraft] = useState<[number, number]>([priceMin, priceMax])
  const [priceOpen, setPriceOpen] = useState(false)
  const [sort, setSort] = useState<SortOption>('sortOrder')
  const [sortOpen, setSortOpen] = useState(false)
  const [gridCols, setGridCols] = useState<GridCols>(5)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)

  const buildQuery = useCallback(
    (nextPage: number) => {
      const qs = new URLSearchParams({
        slug: categorySlug,
        page: String(nextPage),
        limit: String(pageSize),
        sort,
        availability,
      })
      if (priceRange[0] > priceMin) qs.set('minPrice', String(priceRange[0]))
      if (priceRange[1] < priceMax) qs.set('maxPrice', String(priceRange[1]))
      return qs.toString()
    },
    [categorySlug, pageSize, sort, availability, priceRange, priceMin, priceMax],
  )

  // Refetch from page 1 whenever filters or sort change
  useEffect(() => {
    const filtersDirty =
      availability !== 'all' ||
      sort !== 'sortOrder' ||
      priceRange[0] > priceMin ||
      priceRange[1] < priceMax
    if (!filtersDirty) {
      // Reset to initial server-rendered state
      setProducts(initialProducts)
      setTotalDocs(initialTotalDocs)
      setHasMore(initialHasMore)
      setPage(1)
      return
    }
    const reqId = ++requestIdRef.current
    setLoading(true)
    fetch(`/api/products/by-category?${buildQuery(1)}`)
      .then((r) => r.json() as Promise<FetchResult>)
      .then((data) => {
        if (requestIdRef.current !== reqId) return
        setProducts(data.docs)
        setTotalDocs(data.totalDocs)
        setHasMore(data.hasNextPage)
        setPage(1)
      })
      .catch(() => {
        if (requestIdRef.current !== reqId) return
        setProducts([])
        setHasMore(false)
      })
      .finally(() => {
        if (requestIdRef.current === reqId) setLoading(false)
      })
  }, [availability, sort, priceRange, priceMin, priceMax, buildQuery, initialProducts, initialTotalDocs, initialHasMore])

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    const nextPage = page + 1
    const reqId = ++requestIdRef.current
    setLoading(true)
    fetch(`/api/products/by-category?${buildQuery(nextPage)}`)
      .then((r) => r.json() as Promise<FetchResult>)
      .then((data) => {
        if (requestIdRef.current !== reqId) return
        setProducts((prev) => [...prev, ...data.docs])
        setHasMore(data.hasNextPage)
        setPage(nextPage)
      })
      .catch(() => {})
      .finally(() => {
        if (requestIdRef.current === reqId) setLoading(false)
      })
  }, [loading, hasMore, page, buildQuery])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '400px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore])

  const sortLabels: Record<SortOption, string> = {
    sortOrder: 'Recomendado',
    price_asc: 'Preço: menor → maior',
    price_desc: 'Preço: maior → menor',
    name_asc: 'Nome: A → Z',
    name_desc: 'Nome: Z → A',
  }

  const availLabels: Record<AvailFilter, string> = {
    all: 'Todos',
    in_stock: 'Em stock',
    out_of_stock: 'Esgotado',
  }

  const gridClass = gridCols === 5
    ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
    : 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'

  const priceFilterActive = priceRange[0] > priceMin || priceRange[1] < priceMax

  const applyPrice = () => {
    setPriceRange(priceDraft)
    setPriceOpen(false)
  }

  const clearPrice = () => {
    setPriceDraft([priceMin, priceMax])
    setPriceRange([priceMin, priceMax])
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-8">
        <div className="flex items-center gap-6 text-sm text-brand-gray">
          {/* Availability dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setAvailOpen(!availOpen); setPriceOpen(false); setSortOpen(false) }}
              className="hover:text-brand-dark transition-colors flex items-center gap-1"
            >
              Disponibilidade
              {availability !== 'all' && (
                <span className="text-[10px] bg-brand-dark text-white px-1.5 rounded-full ml-1">1</span>
              )}
              <span className="text-[10px]">▾</span>
            </button>
            {availOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-md py-1 z-20 min-w-[160px]">
                {(Object.entries(availLabels) as [AvailFilter, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setAvailability(value); setAvailOpen(false) }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      availability === value ? 'text-brand-dark font-medium' : 'text-brand-gray'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPriceOpen(!priceOpen)
                setAvailOpen(false)
                setSortOpen(false)
                if (!priceOpen) setPriceDraft(priceRange)
              }}
              className="hover:text-brand-dark transition-colors flex items-center gap-1"
            >
              Preço
              {priceFilterActive && (
                <span className="text-[10px] bg-brand-dark text-white px-1.5 rounded-full ml-1">1</span>
              )}
              <span className="text-[10px]">▾</span>
            </button>
            {priceOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-md p-4 z-20 min-w-[260px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-brand-gray uppercase tracking-wider block mb-1">Min</label>
                    <input
                      type="number"
                      min={priceMin}
                      max={priceDraft[1]}
                      step={0.5}
                      value={priceDraft[0]}
                      onChange={(e) => setPriceDraft([Number(e.target.value), priceDraft[1]])}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <span className="text-brand-gray mt-4">—</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-brand-gray uppercase tracking-wider block mb-1">Max</label>
                    <input
                      type="number"
                      min={priceDraft[0]}
                      max={priceMax}
                      step={0.5}
                      value={priceDraft[1]}
                      onChange={(e) => setPriceDraft([priceDraft[0], Number(e.target.value)])}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-brand-gray mb-3">
                  {priceMin.toFixed(2)}€ — {priceMax.toFixed(2)}€
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyPrice}
                    className="text-xs bg-brand-dark text-white px-3 py-1.5 rounded hover:opacity-90"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={clearPrice}
                    className="text-[10px] text-brand-dark underline"
                  >
                    Limpar filtro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-brand-gray">
          <span>{totalDocs} {totalDocs === 1 ? 'item' : 'itens'}</span>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setSortOpen(!sortOpen); setAvailOpen(false); setPriceOpen(false) }}
              className="hover:text-brand-dark transition-colors flex items-center gap-1"
            >
              Ordenar <span className="text-[10px]">▾</span>
            </button>
            {sortOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-md py-1 z-20 min-w-[200px]">
                {(Object.entries(sortLabels) as [SortOption, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setSort(value); setSortOpen(false) }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      sort === value ? 'text-brand-dark font-medium' : 'text-brand-gray'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid view toggles */}
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => setGridCols(4)}
              className={`w-7 h-7 flex items-center justify-center border transition-colors ${
                gridCols === 4 ? 'border-brand-dark text-brand-dark' : 'border-gray-200 text-brand-gray hover:border-brand-dark hover:text-brand-dark'
              }`}
              aria-label="Grid 4 colunas"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="0" y="0" width="6" height="6" />
                <rect x="8" y="0" width="6" height="6" />
                <rect x="0" y="8" width="6" height="6" />
                <rect x="8" y="8" width="6" height="6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setGridCols(5)}
              className={`w-7 h-7 flex items-center justify-center border transition-colors ${
                gridCols === 5 ? 'border-brand-dark text-brand-dark' : 'border-gray-200 text-brand-gray hover:border-brand-dark hover:text-brand-dark'
              }`}
              aria-label="Grid 5 colunas"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="0" y="0" width="3" height="3" />
                <rect x="4" y="0" width="3" height="3" />
                <rect x="8" y="0" width="3" height="3" />
                <rect x="0" y="4" width="3" height="3" />
                <rect x="4" y="4" width="3" height="3" />
                <rect x="8" y="4" width="3" height="3" />
                <rect x="0" y="8" width="3" height="3" />
                <rect x="4" y="8" width="3" height="3" />
                <rect x="8" y="8" width="3" height="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Product grid */}
      {products.length === 0 && !loading ? (
        <p className="text-center text-brand-gray py-12">
          Nenhum produto encontrado em {categoryName}.
        </p>
      ) : (
        <div className={gridClass}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Sentinel + status */}
      <div ref={sentinelRef} className="h-10" />
      <div className="text-center py-8 text-sm text-brand-gray">
        {loading && 'A carregar...'}
        {!loading && !hasMore && products.length > 0 && 'Não há mais produtos.'}
      </div>
    </>
  )
}
