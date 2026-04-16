'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './AttributesPanel.scss'

type ColorDoc = { id: number | string; name: string; hex?: string; slug: string }
type SizeDoc = { id: number | string; name: string; slug: string }

type VariantRow = {
  id?: string
  colorId: number | string | null
  sizeIds: Array<number | string>
  price: number | null
  availability: 'in_stock' | 'out_of_stock'
}

type ProductRow = {
  id: number | string
  name: string
  slug: string
  categoryName: string | null
  imageUrl: string | null
  enableColors: boolean
  enableSizes: boolean
  colorIds: Array<number | string>
  sizeIds: Array<number | string>
  variants: VariantRow[]
}

type Category = { id: number | string; name: string; slug: string }

type FetchResult = {
  docs: ProductRow[]
  page: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
  allColors: ColorDoc[]
  allSizes: SizeDoc[]
}

type RowState = {
  colorIds: Set<string>
  sizeIds: Set<string>
  variantAvail: Record<string, 'in_stock' | 'out_of_stock'>
  variantDeleted: Set<string>
  dirty: boolean
  saving: boolean
  saved: boolean
  error: string | null
}

const PAGE_SIZE = 30
const idStr = (v: number | string) => String(v)

export const AttributesPanel: React.FC = () => {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [allColors, setAllColors] = useState<ColorDoc[]>([])
  const [allSizes, setAllSizes] = useState<SizeDoc[]>([])
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

  const requestIdRef = useRef(0)

  // Fetch categories once
  useEffect(() => {
    fetch('/api/categories?limit=100&depth=0', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { docs?: Category[] }) => setCategories(d.docs || []))
      .catch(() => {})
  }, [])

  // Debounce search
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

      fetch(`/api/admin/attributes?${qs.toString()}`, { credentials: 'include' })
        .then((r) => r.json() as Promise<FetchResult>)
        .then((data) => {
          if (requestIdRef.current !== reqId) return
          setProducts(data.docs)
          setAllColors(data.allColors)
          setAllSizes(data.allSizes)
          setPage(data.page)
          setTotalPages(data.totalPages)
          setTotalDocs(data.totalDocs)

          const next: Record<string | number, RowState> = {}
          for (const p of data.docs) {
            const variantAvail: Record<string, 'in_stock' | 'out_of_stock'> = {}
            for (const v of p.variants) if (v.id) variantAvail[v.id] = v.availability
            next[p.id] = {
              colorIds: new Set(p.colorIds.map(idStr)),
              sizeIds: new Set(p.sizeIds.map(idStr)),
              variantAvail,
              variantDeleted: new Set(),
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
    [categoryId, search],
  )

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  const toggleColor = (productId: string | number, colorId: string) => {
    setRowState((prev) => {
      const cur = prev[productId]
      if (!cur) return prev
      const next = new Set(cur.colorIds)
      if (next.has(colorId)) next.delete(colorId)
      else next.add(colorId)
      return { ...prev, [productId]: { ...cur, colorIds: next, dirty: true, saved: false, error: null } }
    })
  }

  const toggleSize = (productId: string | number, sizeId: string) => {
    setRowState((prev) => {
      const cur = prev[productId]
      if (!cur) return prev
      const next = new Set(cur.sizeIds)
      if (next.has(sizeId)) next.delete(sizeId)
      else next.add(sizeId)
      return { ...prev, [productId]: { ...cur, sizeIds: next, dirty: true, saved: false, error: null } }
    })
  }

  const toggleVariantAvail = (productId: string | number, variantId: string) => {
    setRowState((prev) => {
      const cur = prev[productId]
      if (!cur) return prev
      const current = cur.variantAvail[variantId] || 'in_stock'
      const next: 'in_stock' | 'out_of_stock' = current === 'in_stock' ? 'out_of_stock' : 'in_stock'
      const variantAvail: Record<string, 'in_stock' | 'out_of_stock'> = {
        ...cur.variantAvail,
        [variantId]: next,
      }
      return {
        ...prev,
        [productId]: { ...cur, variantAvail, dirty: true, saved: false, error: null },
      }
    })
  }

  const toggleVariantDelete = (productId: string | number, variantId: string) => {
    setRowState((prev) => {
      const cur = prev[productId]
      if (!cur) return prev
      const next = new Set(cur.variantDeleted)
      if (next.has(variantId)) next.delete(variantId)
      else next.add(variantId)
      return {
        ...prev,
        [productId]: { ...cur, variantDeleted: next, dirty: true, saved: false, error: null },
      }
    })
  }

  const saveRow = async (product: ProductRow) => {
    const state = rowState[product.id]
    if (!state || !state.dirty) return

    setRowState((prev) => ({
      ...prev,
      [product.id]: { ...prev[product.id]!, saving: true, error: null },
    }))

    const body: {
      id: string | number
      colors?: Array<number | string>
      sizes?: Array<number | string>
      variantPatches?: Array<{ id: string; availability: 'in_stock' | 'out_of_stock' }>
      deleteVariantIds?: string[]
    } = { id: product.id }

    // Diff colors
    const origColors = new Set(product.colorIds.map(idStr))
    const sameColors =
      origColors.size === state.colorIds.size &&
      [...state.colorIds].every((c) => origColors.has(c))
    if (!sameColors) {
      // Send original-typed IDs back (number or string), preserved by re-mapping from allColors
      body.colors = [...state.colorIds]
        .map((cid) => allColors.find((c) => idStr(c.id) === cid)?.id)
        .filter((v): v is number | string => v !== undefined)
    }

    // Diff sizes
    const origSizes = new Set(product.sizeIds.map(idStr))
    const sameSizes =
      origSizes.size === state.sizeIds.size &&
      [...state.sizeIds].every((s) => origSizes.has(s))
    if (!sameSizes) {
      body.sizes = [...state.sizeIds]
        .map((sid) => allSizes.find((s) => idStr(s.id) === sid)?.id)
        .filter((v): v is number | string => v !== undefined)
    }

    // Variant patches (availability flips)
    const variantPatches: Array<{ id: string; availability: 'in_stock' | 'out_of_stock' }> = []
    for (const v of product.variants) {
      if (!v.id) continue
      if (state.variantDeleted.has(v.id)) continue
      const newAvail = state.variantAvail[v.id]
      if (newAvail && newAvail !== v.availability) {
        variantPatches.push({ id: v.id, availability: newAvail })
      }
    }
    if (variantPatches.length) body.variantPatches = variantPatches

    if (state.variantDeleted.size > 0) body.deleteVariantIds = [...state.variantDeleted]

    if (
      body.colors === undefined &&
      body.sizes === undefined &&
      !body.variantPatches &&
      !body.deleteVariantIds
    ) {
      setRowState((prev) => ({
        ...prev,
        [product.id]: { ...prev[product.id]!, saving: false, dirty: false },
      }))
      return
    }

    try {
      const res = await fetch('/api/admin/attributes', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      // Apply changes to local product cache
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== product.id) return p
          const next: ProductRow = {
            ...p,
            colorIds: body.colors ?? p.colorIds,
            sizeIds: body.sizes ?? p.sizeIds,
            variants: p.variants
              .filter((v) => !v.id || !state.variantDeleted.has(v.id))
              .map((v) => {
                if (!v.id) return v
                const newAvail = state.variantAvail[v.id]
                return newAvail ? { ...v, availability: newAvail } : v
              }),
          }
          return next
        }),
      )

      setRowState((prev) => ({
        ...prev,
        [product.id]: {
          ...prev[product.id]!,
          saving: false,
          dirty: false,
          saved: true,
          variantDeleted: new Set<string>(),
        },
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

  const colorById = useMemo(() => {
    const m = new Map<string, ColorDoc>()
    for (const c of allColors) m.set(idStr(c.id), c)
    return m
  }, [allColors])

  const sizeById = useMemo(() => {
    const m = new Map<string, SizeDoc>()
    for (const s of allSizes) m.set(idStr(s.id), s)
    return m
  }, [allSizes])

  const variantLabel = (v: VariantRow) => {
    const parts: string[] = []
    if (v.colorId !== null) {
      const c = colorById.get(idStr(v.colorId))
      parts.push(c?.name || `cor ${v.colorId}`)
    }
    if (v.sizeIds.length) {
      parts.push(v.sizeIds.map((sid) => sizeById.get(idStr(sid))?.name || sid).join('/'))
    }
    return parts.join(' · ') || 'Variante'
  }

  return (
    <div className="attr-panel">
      <div className="attr-panel__header">
        <h1 className="attr-panel__title">CORES, TAMANHOS E VARIANTES</h1>
        <p className="attr-panel__subtitle">EDIÇÃO EM MASSA DE ATRIBUTOS DE PRODUTOS</p>
      </div>

      <div className="attr-panel__toolbar">
        <input
          type="text"
          placeholder="Pesquisar por nome..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="attr-panel__search"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="attr-panel__select"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="attr-panel__count">
          {totalDocs} produto{totalDocs === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          className="attr-panel__btn attr-panel__btn--primary"
          onClick={saveAll}
          disabled={dirtyCount === 0}
        >
          Guardar todos ({dirtyCount})
        </button>
      </div>

      {loading ? (
        <p className="attr-panel__empty">A carregar...</p>
      ) : products.length === 0 ? (
        <p className="attr-panel__empty">Sem resultados.</p>
      ) : (
        <table className="attr-panel__table">
          <thead>
            <tr>
              <th />
              <th>Imagem</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Cores</th>
              <th>Tamanhos</th>
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
              const colorsActive = state.colorIds
              const sizesActive = state.sizeIds

              return (
                <React.Fragment key={p.id}>
                  <tr className={state.dirty ? 'attr-panel__row--dirty' : ''}>
                    <td>
                      {hasVariants ? (
                        <button
                          type="button"
                          className="attr-panel__expand"
                          onClick={() => toggleExpanded(p.id)}
                          aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      ) : (
                        <span className="attr-panel__expand attr-panel__expand--ghost">·</span>
                      )}
                    </td>
                    <td>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="attr-panel__thumb" />
                      ) : (
                        <div className="attr-panel__thumb attr-panel__thumb--empty" />
                      )}
                    </td>
                    <td>
                      <a href={`/admin/collections/products/${p.id}`} className="attr-panel__name">
                        {p.name}
                      </a>
                      <div className="attr-panel__slug">{p.slug}</div>
                    </td>
                    <td>{p.categoryName || '—'}</td>
                    <td>
                      {!p.enableColors ? (
                        <span className="attr-panel__muted">Desativado</span>
                      ) : allColors.length === 0 ? (
                        <span className="attr-panel__muted">—</span>
                      ) : (
                        <div className="attr-panel__chips">
                          {allColors.map((c) => {
                            const cid = idStr(c.id)
                            const active = colorsActive.has(cid)
                            return (
                              <button
                                key={cid}
                                type="button"
                                className={`attr-panel__chip attr-panel__chip--color ${active ? 'is-active' : ''}`}
                                onClick={() => toggleColor(p.id, cid)}
                                title={c.name}
                              >
                                <span
                                  className="attr-panel__chip-swatch"
                                  style={{ background: c.hex || '#ddd' }}
                                />
                                <span>{c.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </td>
                    <td>
                      {!p.enableSizes ? (
                        <span className="attr-panel__muted">Desativado</span>
                      ) : allSizes.length === 0 ? (
                        <span className="attr-panel__muted">—</span>
                      ) : (
                        <div className="attr-panel__chips">
                          {allSizes.map((s) => {
                            const sid = idStr(s.id)
                            const active = sizesActive.has(sid)
                            return (
                              <button
                                key={sid}
                                type="button"
                                className={`attr-panel__chip ${active ? 'is-active' : ''}`}
                                onClick={() => toggleSize(p.id, sid)}
                              >
                                {s.name}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </td>
                    <td className="attr-panel__variants-cell">
                      {hasVariants ? `${p.variants.length}` : '—'}
                    </td>
                    <td>
                      <div className="attr-panel__actions">
                        <button
                          type="button"
                          className="attr-panel__btn"
                          onClick={() => saveRow(p)}
                          disabled={!state.dirty || state.saving}
                        >
                          {state.saving ? '...' : state.saved ? '✓' : 'Guardar'}
                        </button>
                        <a
                          href={`/products/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attr-panel__btn attr-panel__btn--icon"
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
                      {state.error && <div className="attr-panel__error">{state.error}</div>}
                    </td>
                  </tr>
                  {isExpanded &&
                    p.variants.map((v) => {
                      const isDeleted = v.id ? state.variantDeleted.has(v.id) : false
                      const avail = v.id
                        ? state.variantAvail[v.id] || v.availability
                        : v.availability
                      return (
                        <tr
                          key={`${p.id}-${v.id}`}
                          className={`attr-panel__variant-row ${isDeleted ? 'is-deleted' : ''}`}
                        >
                          <td />
                          <td colSpan={3} className="attr-panel__variant-label">
                            ↳ {variantLabel(v)}
                            {typeof v.price === 'number' && v.price > 0 && (
                              <span className="attr-panel__variant-price">
                                {' '}
                                · €{v.price.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td colSpan={2}>
                            {v.id && (
                              <div className="attr-panel__variant-controls">
                                <button
                                  type="button"
                                  className={`attr-panel__btn attr-panel__btn--small ${
                                    avail === 'in_stock' ? 'attr-panel__btn--green' : 'attr-panel__btn--red'
                                  }`}
                                  onClick={() => v.id && toggleVariantAvail(p.id, v.id)}
                                  disabled={isDeleted}
                                >
                                  {avail === 'in_stock' ? 'Em stock' : 'Esgotado'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td colSpan={2}>
                            {v.id && (
                              <button
                                type="button"
                                className="attr-panel__btn attr-panel__btn--small"
                                onClick={() => v.id && toggleVariantDelete(p.id, v.id)}
                              >
                                {isDeleted ? 'Restaurar' : 'Apagar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="attr-panel__pagination">
          <button
            type="button"
            className="attr-panel__btn"
            disabled={page <= 1 || loading}
            onClick={() => fetchPage(page - 1)}
          >
            ← Anterior
          </button>
          <span className="attr-panel__page">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="attr-panel__btn"
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
