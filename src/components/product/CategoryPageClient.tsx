'use client'
import React, { useState, useMemo } from 'react'
import { ProductCard } from './ProductCard'
import { Pagination } from '../ui/Pagination'
import type { Product } from '../../../payload-types'

type SortOption = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'
type AvailFilter = 'all' | 'in_stock' | 'out_of_stock'
type GridCols = 4 | 5

type Props = {
  products: Product[]
  categoryName: string
  categorySlug: string
  currentPage: number
  totalPages: number
  totalDocs: number
  perPage: number
  perPageOptions: number[]
}

export const CategoryPageClient: React.FC<Props> = ({
  products,
  categoryName,
  categorySlug,
  currentPage,
  totalPages,
  totalDocs,
  perPage,
  perPageOptions,
}) => {
  const [availability, setAvailability] = useState<AvailFilter>('all')
  const [availOpen, setAvailOpen] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0])
  const [priceOpen, setPriceOpen] = useState(false)
  const [priceInited, setPriceInited] = useState(false)
  const [sort, setSort] = useState<SortOption>('name_asc')
  const [sortOpen, setSortOpen] = useState(false)
  const [gridCols, setGridCols] = useState<GridCols>(5)

  // Compute min/max price from products
  const { minPrice, maxPrice } = useMemo(() => {
    const prices = products.map((p) => (p as any).price || 0).filter((p: number) => p > 0)
    if (prices.length === 0) return { minPrice: 0, maxPrice: 0 }
    return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) }
  }, [products])

  // Init price range on first open
  const handlePriceOpen = () => {
    if (!priceInited) {
      setPriceRange([minPrice, maxPrice])
      setPriceInited(true)
    }
    setPriceOpen(!priceOpen)
    setAvailOpen(false)
    setSortOpen(false)
  }

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...products]

    // Availability filter
    if (availability !== 'all') {
      result = result.filter((p) => (p as any).availability === availability)
    }

    // Price filter
    if (priceInited) {
      result = result.filter((p) => {
        const price = (p as any).price || 0
        return price >= priceRange[0] && price <= priceRange[1]
      })
    }

    // Sort
    result.sort((a, b) => {
      const priceA = (a as any).price || 0
      const priceB = (b as any).price || 0
      switch (sort) {
        case 'price_asc':
          return priceA - priceB
        case 'price_desc':
          return priceB - priceA
        case 'name_asc':
          return a.name.localeCompare(b.name, 'pt')
        case 'name_desc':
          return b.name.localeCompare(a.name, 'pt')
        default:
          return 0
      }
    })

    return result
  }, [products, availability, priceRange, priceInited, sort])

  const sortLabels: Record<SortOption, string> = {
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
              onClick={handlePriceOpen}
              className="hover:text-brand-dark transition-colors flex items-center gap-1"
            >
              Preço
              {priceInited && (priceRange[0] > minPrice || priceRange[1] < maxPrice) && (
                <span className="text-[10px] bg-brand-dark text-white px-1.5 rounded-full ml-1">1</span>
              )}
              <span className="text-[10px]">▾</span>
            </button>
            {priceOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-md p-4 z-20 min-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-brand-gray uppercase tracking-wider block mb-1">Min</label>
                    <input
                      type="number"
                      min={minPrice}
                      max={priceRange[1]}
                      step={0.5}
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <span className="text-brand-gray mt-4">—</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-brand-gray uppercase tracking-wider block mb-1">Max</label>
                    <input
                      type="number"
                      min={priceRange[0]}
                      max={maxPrice}
                      step={0.5}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-brand-gray">
                  {minPrice.toFixed(2)}€ — {maxPrice.toFixed(2)}€
                </div>
                <button
                  type="button"
                  onClick={() => { setPriceRange([minPrice, maxPrice]) }}
                  className="text-[10px] text-brand-dark underline mt-2"
                >
                  Limpar filtro
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-brand-gray">
          <span>{totalDocs} {totalDocs === 1 ? 'item' : 'itens'}</span>

          {/* Per-page selector */}
          <label className="flex items-center gap-2">
            <span className="hidden sm:inline">Por página</span>
            <select
              value={perPage}
              onChange={(e) => {
                const params = new URLSearchParams()
                params.set('perPage', e.target.value)
                window.location.href = `/categories/${categorySlug}?${params.toString()}`
              }}
              className="border border-gray-200 rounded px-2 py-1 text-sm bg-white"
            >
              {perPageOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>

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
      {filtered.length === 0 ? (
        <p className="text-center text-brand-gray py-12">
          Nenhum produto encontrado em {categoryName}.
        </p>
      ) : (
        <div className={gridClass}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(p) => {
          const params = new URLSearchParams()
          if (perPage !== 24) params.set('perPage', String(perPage))
          if (p > 1) params.set('page', String(p))
          const qs = params.toString()
          return qs ? `/categories/${categorySlug}?${qs}` : `/categories/${categorySlug}`
        }}
      />
    </>
  )
}
