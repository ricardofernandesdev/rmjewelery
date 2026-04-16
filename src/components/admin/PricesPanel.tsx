'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './PricesPanel.scss'

type VariantRow = {
  id?: string
  color: string | null
  sizeLabels: string[]
  price: number | null
}

type ProductRow = {
  id: number | string
  name: string
  slug: string
  price: number
  categoryName: string | null
  imageUrl: string | null
  variants: VariantRow[]
}

type Category = { id: number | string; name: string; slug: string }

type FetchResult = {
  docs: ProductRow[]
  page: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
}

type RowState = {
  basePrice: string
  variantPrices: Record<string, string>
  dirty: boolean
  saving: boolean
  saved: boolean
  error: string | null
}

const PAGE_SIZE = 30

export const PricesPanel: React.FC = () => {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [expanded, setExpanded] = useState<Set<string | number>>(new Set())
  const [rowState, setRowState] = useState<Record<string | number, RowState>>({})
  const [hideZero, setHideZero] = useState(false)

  const requestIdRef = useRef(0)

  // Fetch categories once
  useEffect(() => {
    fetch('/api/categories?limit=100&depth=0', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { docs?: Category[] }) => setCategories(d.docs || []))
      .catch(() => {})
  }, [])

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchPage = useCallback(
    (targetPage: number) => {
      const reqId = ++requestIdRef.current
      setLoading(true)
      const qs = new URLSearchParams({
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      })
      if (categoryId) qs.set('category', categoryId)
      if (search) qs.set('search', search)

      fetch(`/api/admin/prices?${qs.toString()}`, { credentials: 'include' })
        .then((r) => r.json() as Promise<FetchResult>)
        .then((data) => {
          if (requestIdRef.current !== reqId) return
          let docs = data.docs
          if (hideZero) {
            docs = docs.filter(
              (p) => p.price > 0 || p.variants.some((v) => typeof v.price === 'number' && v.price > 0),
            )
          }
          setProducts(docs)
          setPage(data.page)
          setTotalPages(data.totalPages)
          setTotalDocs(data.totalDocs)

          // seed rowState with current values
          const next: Record<string | number, RowState> = {}
          for (const p of docs) {
            next[p.id] = {
              basePrice: String(p.price ?? 0),
              variantPrices: Object.fromEntries(
                p.variants.filter((v) => v.id).map((v) => [v.id!, v.price === null ? '' : String(v.price)]),
              ),
              dirty: false,
              saving: false,
              saved: false,
              error: null,
            }
          }
          setRowState(next)
          setExpanded(new Set())
        })
        .catch(() => {
          if (requestIdRef.current !== reqId) return
          setProducts([])
        })
        .finally(() => {
          if (requestIdRef.current === reqId) setLoading(false)
        })
    },
    [categoryId, search, hideZero],
  )

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  const updateBase = (id: string | number, value: string) => {
    setRowState((prev) => ({
      ...prev,
      [id]: { ...prev[id]!, basePrice: value, dirty: true, saved: false, error: null },
    }))
  }

  const updateVariant = (id: string | number, variantId: string, value: string) => {
    setRowState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id]!,
        variantPrices: { ...prev[id]!.variantPrices, [variantId]: value },
        dirty: true,
        saved: false,
        error: null,
      },
    }))
  }

  const saveRow = async (product: ProductRow) => {
    const state = rowState[product.id]
    if (!state || !state.dirty) return

    setRowState((prev) => ({ ...prev, [product.id]: { ...prev[product.id]!, saving: true, error: null } }))

    const body: {
      id: string | number
      price?: number
      variants?: Array<{ id: string; price: number | null }>
    } = { id: product.id }

    const basePriceNum = Number(state.basePrice)
    if (Number.isFinite(basePriceNum) && basePriceNum !== product.price) {
      body.price = basePriceNum
    }

    const variantUpdates: Array<{ id: string; price: number | null }> = []
    for (const v of product.variants) {
      if (!v.id) continue
      const raw = state.variantPrices[v.id]
      if (raw === undefined) continue
      if (raw === '') {
        if (v.price !== null) variantUpdates.push({ id: v.id, price: null })
      } else {
        const num = Number(raw)
        if (Number.isFinite(num) && num !== v.price) variantUpdates.push({ id: v.id, price: num })
      }
    }
    if (variantUpdates.length) body.variants = variantUpdates

    if (body.price === undefined && !body.variants) {
      setRowState((prev) => ({ ...prev, [product.id]: { ...prev[product.id]!, saving: false, dirty: false } }))
      return
    }

    try {
      const res = await fetch('/api/admin/prices', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      // Update local product cache so subsequent diffs are correct
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== product.id) return p
          const updated: ProductRow = {
            ...p,
            price: body.price !== undefined ? body.price : p.price,
            variants: p.variants.map((v) => {
              if (!v.id) return v
              const upd = body.variants?.find((u) => u.id === v.id)
              return upd ? { ...v, price: upd.price } : v
            }),
          }
          return updated
        }),
      )
      setRowState((prev) => ({
        ...prev,
        [product.id]: { ...prev[product.id]!, saving: false, dirty: false, saved: true },
      }))
      setTimeout(() => {
        setRowState((prev) => {
          if (!prev[product.id]) return prev
          return { ...prev, [product.id]: { ...prev[product.id]!, saved: false } }
        })
      }, 2000)
    } catch (e) {
      setRowState((prev) => ({
        ...prev,
        [product.id]: {
          ...prev[product.id]!,
          saving: false,
          error: e instanceof Error ? e.message : 'Erro ao guardar',
        },
      }))
    }
  }

  const toggleExpanded = (id: string | number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const variantSummary = (v: VariantRow) => {
    const parts: string[] = []
    if (v.color) parts.push(v.color)
    if (v.sizeLabels.length) parts.push(v.sizeLabels.join('/'))
    return parts.join(' · ') || 'Variante'
  }

  const dirtyCount = useMemo(
    () => Object.values(rowState).filter((s) => s.dirty).length,
    [rowState],
  )

  const saveAll = async () => {
    for (const p of products) {
      if (rowState[p.id]?.dirty) {
        // eslint-disable-next-line no-await-in-loop
        await saveRow(p)
      }
    }
  }

  return (
    <div className="prices-panel">
      <div className="prices-panel__header">
        <h1 className="prices-panel__title">PREÇOS</h1>
        <p className="prices-panel__subtitle">EDIÇÃO EM MASSA DE PREÇOS DE PRODUTOS</p>
      </div>

      <div className="prices-panel__toolbar">
        <input
          type="text"
          placeholder="Pesquisar por nome..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="prices-panel__search"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="prices-panel__select"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="prices-panel__checkbox">
          <input type="checkbox" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} />
          Esconder produtos com preço 0
        </label>
        <span className="prices-panel__count">
          {totalDocs} produto{totalDocs === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          className="prices-panel__btn prices-panel__btn--primary"
          onClick={saveAll}
          disabled={dirtyCount === 0}
        >
          Guardar todos ({dirtyCount})
        </button>
      </div>

      {loading ? (
        <p className="prices-panel__empty">A carregar...</p>
      ) : products.length === 0 ? (
        <p className="prices-panel__empty">Sem resultados.</p>
      ) : (
        <table className="prices-panel__table">
          <thead>
            <tr>
              <th />
              <th>Imagem</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Preço base (€)</th>
              <th>Variantes</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const state = rowState[p.id]
              if (!state) return null
              const isExpanded = expanded.has(p.id)
              const hasVariants = p.variants.length > 0
              return (
                <React.Fragment key={p.id}>
                  <tr className={state.dirty ? 'prices-panel__row--dirty' : ''}>
                    <td>
                      {hasVariants ? (
                        <button
                          type="button"
                          className="prices-panel__expand"
                          onClick={() => toggleExpanded(p.id)}
                          aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      ) : (
                        <span className="prices-panel__expand prices-panel__expand--ghost">·</span>
                      )}
                    </td>
                    <td>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="prices-panel__thumb" />
                      ) : (
                        <div className="prices-panel__thumb prices-panel__thumb--empty" />
                      )}
                    </td>
                    <td>
                      <a href={`/admin/collections/products/${p.id}`} className="prices-panel__name">
                        {p.name}
                      </a>
                      <div className="prices-panel__slug">{p.slug}</div>
                    </td>
                    <td>{p.categoryName || '—'}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={state.basePrice}
                        onChange={(e) => updateBase(p.id, e.target.value)}
                        className="prices-panel__input"
                      />
                    </td>
                    <td className="prices-panel__variants-cell">
                      {hasVariants ? `${p.variants.length} variante${p.variants.length === 1 ? '' : 's'}` : '—'}
                    </td>
                    <td>
                      <div className="prices-panel__actions">
                        <button
                          type="button"
                          className="prices-panel__btn"
                          onClick={() => saveRow(p)}
                          disabled={!state.dirty || state.saving}
                        >
                          {state.saving ? '...' : state.saved ? '✓' : 'Guardar'}
                        </button>
                        <a
                          href={`/products/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="prices-panel__btn prices-panel__btn--icon"
                          title="Abrir produto numa nova tab"
                          aria-label="Abrir produto numa nova tab"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                      {state.error && <div className="prices-panel__error">{state.error}</div>}
                    </td>
                  </tr>
                  {isExpanded &&
                    p.variants.map((v) => (
                      <tr key={`${p.id}-${v.id}`} className="prices-panel__variant-row">
                        <td />
                        <td colSpan={3} className="prices-panel__variant-label">
                          ↳ {variantSummary(v)}
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="herda do base"
                            value={v.id ? state.variantPrices[v.id] ?? '' : ''}
                            onChange={(e) => v.id && updateVariant(p.id, v.id, e.target.value)}
                            className="prices-panel__input"
                          />
                        </td>
                        <td colSpan={2} />
                      </tr>
                    ))}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="prices-panel__pagination">
          <button
            type="button"
            className="prices-panel__btn"
            disabled={page <= 1 || loading}
            onClick={() => fetchPage(page - 1)}
          >
            ← Anterior
          </button>
          <span className="prices-panel__page">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="prices-panel__btn"
            disabled={page >= totalPages || loading}
            onClick={() => fetchPage(page + 1)}
          >
            Seguinte →
          </button>
        </div>
      )}
    </div>
  )
}
