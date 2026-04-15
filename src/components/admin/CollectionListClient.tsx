'use client'
import React, { useState, useEffect } from 'react'
import { ConfirmModal } from './ConfirmModal'
import { BulkImport } from './BulkImport'
import './ConfirmModal.scss'

type ColumnDef = {
  key: string
  label: string
}

type Config = {
  title: string
  subtitle: string
  slug: string
  createLabel: string
  columns: ColumnDef[]
  previewPrefix?: string
  hasCategoryFilter?: boolean
  searchFields?: string[]
}

type Category = { id: number; name: string }

type Props = {
  docs: any[]
  totalDocs: number
  totalPages: number
  currentPage: number
  config: Config
  protectedIds?: string[]
}

type ModalState = {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
} | null

export const CollectionListClient: React.FC<Props> = ({
  docs,
  totalDocs,
  totalPages,
  currentPage,
  config,
  protectedIds = [],
}) => {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>(null)
  const [serverResults, setServerResults] = useState<any[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // Fetch categories when filter is enabled
  useEffect(() => {
    if (!config.hasCategoryFilter) return
    fetch('/api/categories?limit=100&depth=0&sort=name', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.docs) setCategories(data.docs.map((c: any) => ({ id: c.id, name: c.name })))
      })
      .catch(() => {})
  }, [config.hasCategoryFilter])

  // Debounced server-side search + category filter across the WHOLE collection
  useEffect(() => {
    const term = search.trim()
    if (!term && !categoryFilter) {
      setServerResults(null)
      return
    }
    setSearching(true)
    const handle = setTimeout(async () => {
      try {
        const params: string[] = ['limit=100', 'depth=1']

        // Search term — match against multiple fields OR matching category name
        if (term) {
          // Resolve categories matching the search term so we can include them
          let matchedCategoryIds: number[] = []
          if (config.hasCategoryFilter) {
            try {
              const catRes = await fetch(
                `/api/categories?where[name][like]=${encodeURIComponent(term)}&limit=50&depth=0`,
                { credentials: 'include' },
              )
              if (catRes.ok) {
                const catData = await catRes.json()
                matchedCategoryIds = (catData.docs || []).map((d: any) => d.id)
              }
            } catch { /* ignore */ }
          }

          // Use only fields that actually exist on this collection
          const fields = config.searchFields ?? ['name', 'slug']
          const orConditions: string[] = fields.map(
            (f, i) => `where[or][${i}][${f}][like]=${encodeURIComponent(term)}`,
          )
          matchedCategoryIds.forEach((id, i) => {
            orConditions.push(`where[or][${fields.length + i}][category][equals]=${id}`)
          })
          params.push(...orConditions)
        }

        // Category dropdown filter (AND condition on top of OR search)
        if (categoryFilter) {
          params.push(`where[category][equals]=${categoryFilter}`)
        }

        const res = await fetch(`/api/${config.slug}?${params.join('&')}`, {
          credentials: 'include',
        })
        if (!res.ok) {
          setServerResults([])
          return
        }
        const data = await res.json()
        // Map server docs to row shape compatible with current renderer
        const rows = await Promise.all(
          (data.docs || []).map(async (doc: any) => {
            const row: any = { id: doc.id, name: doc.name || '', slug: doc.slug || '' }
            // Shared columns
            for (const col of config.columns) {
              if (col.key === 'name' || col.key === 'slug') continue
              if (col.key === 'thumbnail') {
                const first = Array.isArray(doc.images) && doc.images[0]
                row._thumbnailUrl =
                  typeof first === 'object' ? first?.sizes?.thumbnail?.url || first?.url || '' : ''
              } else if (col.key === 'image') {
                row._imageUrl =
                  typeof doc.image === 'object'
                    ? doc.image?.sizes?.thumbnail?.url || doc.image?.url || ''
                    : ''
              } else if (col.key === 'swatch') {
                row._swatchHex = doc.hex || '#cccccc'
              } else if (col.key === 'category') {
                row.category =
                  typeof doc.category === 'object' && doc.category ? doc.category.name : ''
              } else {
                row[col.key] = doc[col.key] || ''
              }
            }
            return row
          }),
        )
        setServerResults(rows)
      } catch {
        setServerResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [search, categoryFilter, config.slug, config.columns, config.hasCategoryFilter])

  const filtered = serverResults !== null ? serverResults : docs

  const deletable = filtered.filter((d) => !protectedIds.includes(String(d.id)))

  const allSelected = deletable.length > 0 && deletable.every((d) => selected.has(d.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(deletable.map((d) => d.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const confirmDeleteOne = (doc: any) => {
    const name = doc.name || doc.filename || doc.id
    setModal({
      title: 'Apagar item',
      message: `Tens a certeza que queres apagar "${name}"? Esta ação não pode ser revertida.`,
      confirmLabel: 'Apagar',
      onConfirm: async () => {
        await fetch(`/api/${config.slug}/${doc.id}`, { method: 'DELETE', credentials: 'include' })
        setModal(null)
        window.location.reload()
      },
    })
  }

  const confirmDeleteSelected = () => {
    setModal({
      title: 'Apagar selecionados',
      message: `Tens a certeza que queres apagar ${selected.size} item(ns)? Esta ação não pode ser revertida.`,
      confirmLabel: `Apagar ${selected.size}`,
      onConfirm: async () => {
        for (const id of selected) {
          await fetch(`/api/${config.slug}/${id}`, { method: 'DELETE', credentials: 'include' })
        }
        setModal(null)
        window.location.reload()
      },
    })
  }

  return (
    <div className="media-list">
      {modal && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          cancelLabel="Cancelar"
          danger
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="media-list__header">
        <div>
          <p className="media-list__subtitle">{config.subtitle}</p>
          <h1 className="media-list__title">{config.title}</h1>
        </div>
        <div className="media-list__actions">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={confirmDeleteSelected}
              className="media-list__btn media-list__btn--danger"
            >
              APAGAR ({selected.size})
            </button>
          )}
          {config.slug === 'products' && <BulkImport />}
          <a
            href={`/admin/collections/${config.slug}/create`}
            className="media-list__btn media-list__btn--filled"
          >
            {config.createLabel}
          </a>
        </div>
      </div>

      <div className="media-list__search">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="text"
          placeholder="Pesquisar em todos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {config.hasCategoryFilter && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              marginLeft: '10px',
              padding: '6px 10px',
              fontSize: '13px',
              border: '1px solid var(--theme-elevation-200)',
              borderRadius: '4px',
              background: 'var(--theme-input-bg, var(--theme-elevation-50))',
              color: 'var(--theme-text)',
              outline: 'none',
              minWidth: '160px',
            }}
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        )}
        {searching && (
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid var(--theme-elevation-200)',
              borderTopColor: 'var(--theme-text)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              marginLeft: 'auto',
              flexShrink: 0,
            }}
          />
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="media-list__table-wrapper">
        <table className="media-list__table">
          <thead>
            <tr>
              <th className="media-list__th-check">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              {config.columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => (
              <tr key={doc.id} className={selected.has(doc.id) ? 'media-list__row--selected' : ''}>
                <td className="media-list__td-check">
                  {!protectedIds.includes(String(doc.id)) ? (
                    <input
                      type="checkbox"
                      checked={selected.has(doc.id)}
                      onChange={() => toggleOne(doc.id)}
                    />
                  ) : (
                    <span title="Utilizador atual" style={{ opacity: 0.3, fontSize: 12 }}>—</span>
                  )}
                </td>
                {config.columns.map((col) => (
                  <td key={col.key}>
                    {col.key === 'image' ? (
                      <div className="media-list__thumb">
                        {doc._imageUrl ? (
                          <img src={doc._imageUrl} alt="" />
                        ) : (
                          <div className="media-list__thumb-placeholder" />
                        )}
                      </div>
                    ) : col.key === 'thumbnail' ? (
                      <div className="media-list__thumb">
                        {doc._thumbnailUrl ? (
                          <img src={doc._thumbnailUrl} alt="" />
                        ) : (
                          <div className="media-list__thumb-placeholder" />
                        )}
                      </div>
                    ) : col.key === 'swatch' ? (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 4,
                          border: '1px solid var(--theme-elevation-200)',
                          backgroundColor: doc._swatchHex || '#cccccc',
                        }}
                      />
                    ) : col.key === 'name' ? (
                      <a
                        href={`/admin/collections/${config.slug}/${doc.id}`}
                        className="media-list__filename"
                      >
                        {doc[col.key]}
                      </a>
                    ) : col.key === 'autoSelect' ? (
                      <span className="media-list__alt">{doc[col.key] ? '✓' : '—'}</span>
                    ) : (
                      <span className="media-list__alt">{doc[col.key] || '—'}</span>
                    )}
                  </td>
                ))}
                <td>
                  <div className="media-list__row-actions">
                    {config.previewPrefix && doc.slug && (
                      <a
                        href={`${config.previewPrefix}/${doc.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="media-list__action-btn"
                        title="Ver no site"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                        </svg>
                      </a>
                    )}
                    <a
                      href={`/admin/collections/${config.slug}/${doc.id}`}
                      className="media-list__action-btn"
                      title="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                    </a>
                    {!protectedIds.includes(String(doc.id)) && (
                      <button
                        type="button"
                        className="media-list__action-btn media-list__action-btn--delete"
                        title="Apagar"
                        onClick={() => confirmDeleteOne(doc)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="media-list__footer">
        <span className="media-list__count">
          A MOSTRAR {filtered.length} DE {totalDocs} ITENS
        </span>
        {totalPages > 1 && (
          <div className="media-list__pagination">
            {currentPage > 1 && (
              <a href={`/admin/collections/${config.slug}?page=${currentPage - 1}`} className="media-list__page-btn">
                &lsaquo;
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p) => (
                <a
                  key={p}
                  href={`/admin/collections/${config.slug}?page=${p}`}
                  className={`media-list__page-btn ${p === currentPage ? 'media-list__page-btn--active' : ''}`}
                >
                  {p}
                </a>
              ))}
            {currentPage < totalPages && (
              <a href={`/admin/collections/${config.slug}?page=${currentPage + 1}`} className="media-list__page-btn">
                &rsaquo;
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
