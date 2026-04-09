'use client'
import React, { useState } from 'react'
import { useListDrawerContext } from '@payloadcms/ui'
import { ConfirmModal } from './ConfirmModal'
import './ConfirmModal.scss'

type MediaDoc = {
  id: string
  filename: string
  alt: string
  mimeType: string
  thumbnailUrl: string
}

type Props = {
  docs: MediaDoc[]
  totalDocs: number
  totalPages: number
  currentPage: number
}

type ModalState = {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
} | null

export const MediaListClient: React.FC<Props> = ({ docs, totalDocs, totalPages, currentPage }) => {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>(null)

  // Detect if rendered inside an upload/relationship picker drawer
  const drawerContext = useListDrawerContext()
  const isInDrawer = Boolean(drawerContext?.isInDrawer)
  const onSelect = drawerContext?.onSelect

  const handlePick = (doc: MediaDoc) => {
    if (isInDrawer && onSelect) {
      onSelect({ collectionSlug: 'media' as any, doc: doc as any, docID: String(doc.id) })
    }
  }

  const filtered = search
    ? docs.filter(
        (d) =>
          d.filename.toLowerCase().includes(search.toLowerCase()) ||
          d.alt.toLowerCase().includes(search.toLowerCase()),
      )
    : docs

  const allSelected = filtered.length > 0 && filtered.every((d) => selected.has(d.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((d) => d.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelected(next)
  }

  const confirmDeleteOne = (doc: MediaDoc) => {
    setModal({
      title: 'Apagar ficheiro',
      message: `Tens a certeza que queres apagar "${doc.filename}"? Esta ação não pode ser revertida.`,
      confirmLabel: 'Apagar',
      onConfirm: async () => {
        await fetch(`/api/media/${doc.id}`, { method: 'DELETE' })
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
          await fetch(`/api/media/${id}`, { method: 'DELETE' })
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
          <p className="media-list__subtitle">GESTÃO DE RECURSOS</p>
          <h1 className="media-list__title">MEDIA</h1>
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
          <a href="/admin/bulk-upload" className="media-list__btn media-list__btn--outline">
            UPLOAD MÚLTIPLO
          </a>
          <a href="/admin/collections/media/create" className="media-list__btn media-list__btn--filled">
            CARREGAR NOVO
          </a>
        </div>
      </div>

      <div className="media-list__search">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="text"
          placeholder="Pesquisar por nome ou texto alt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="media-list__table-wrapper">
        <table className="media-list__table">
          <thead>
            <tr>
              <th className="media-list__th-check">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th>THUMB</th>
              <th>NOME DO FICHEIRO</th>
              <th>TEXTO ALT</th>
              <th>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => (
              <tr
                key={doc.id}
                className={`${selected.has(doc.id) ? 'media-list__row--selected' : ''} ${isInDrawer ? 'media-list__row--selectable' : ''}`}
                onClick={isInDrawer ? () => handlePick(doc) : undefined}
                style={isInDrawer ? { cursor: 'pointer' } : undefined}
              >
                <td className="media-list__td-check">
                  <input
                    type="checkbox"
                    checked={selected.has(doc.id)}
                    onChange={() => toggleOne(doc.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td>
                  <div className="media-list__thumb">
                    {doc.mimeType.startsWith('image/') && doc.thumbnailUrl ? (
                      <img src={doc.thumbnailUrl} alt={doc.alt} />
                    ) : (
                      <div className="media-list__thumb-placeholder" />
                    )}
                  </div>
                </td>
                <td>
                  {isInDrawer ? (
                    <span className="media-list__filename">{doc.filename}</span>
                  ) : (
                    <a href={`/admin/collections/media/${doc.id}`} className="media-list__filename">
                      {doc.filename}
                    </a>
                  )}
                </td>
                <td className="media-list__alt">{doc.alt ? `"${doc.alt}"` : '—'}</td>
                <td>
                  <div className="media-list__row-actions" onClick={(e) => e.stopPropagation()}>
                    {isInDrawer ? (
                      <button
                        type="button"
                        className="media-list__action-btn"
                        title="Selecionar"
                        onClick={() => handlePick(doc)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </button>
                    ) : (
                      <a href={`/admin/collections/media/${doc.id}`} className="media-list__action-btn" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </a>
                    )}
                    {!isInDrawer && (
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
              <a href={`/admin/collections/media?page=${currentPage - 1}`} className="media-list__page-btn">
                &lsaquo;
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p) => (
                <a
                  key={p}
                  href={`/admin/collections/media?page=${p}`}
                  className={`media-list__page-btn ${p === currentPage ? 'media-list__page-btn--active' : ''}`}
                >
                  {p}
                </a>
              ))}
            {currentPage < totalPages && (
              <a href={`/admin/collections/media?page=${currentPage + 1}`} className="media-list__page-btn">
                &rsaquo;
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
