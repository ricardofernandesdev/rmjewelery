'use client'
import React, { useState, useRef, useCallback } from 'react'
import './MediaCreate.scss'

type FileItem = {
  id: string
  file: File
  preview: string | null
  alt: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

let fileCounter = 0

export const MediaBulkUpload: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: FileList | File[]) => {
    const items: FileItem[] = Array.from(newFiles)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => {
        const id = `file-${++fileCounter}`
        const preview = URL.createObjectURL(f)
        return {
          id,
          file: f,
          preview,
          alt: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          status: 'pending' as const,
        }
      })
    setFiles((prev) => [...prev, ...items])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }, [])

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter((f) => f.id !== id)
    })
  }

  const updateAlt = (id: string, alt: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, alt } : f)))
  }

  const uploadAll = async () => {
    setUploading(true)
    const pending = files.filter((f) => f.status === 'pending')

    for (const item of pending) {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading' } : f)),
      )

      try {
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('alt', item.alt || item.file.name)

        const res = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        if (res.ok) {
          setFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, status: 'done' } : f)),
          )
        } else {
          const err = await res.json().catch(() => null)
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: 'error', error: err?.errors?.[0]?.message || 'Erro' }
                : f,
            ),
          )
        }
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'error', error: 'Erro de rede' } : f,
          ),
        )
      }
    }

    setUploading(false)
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const doneCount = files.filter((f) => f.status === 'done').length
  const errorCount = files.filter((f) => f.status === 'error').length
  const allDone = files.length > 0 && pendingCount === 0 && !uploading

  return (
    <div className="media-create">
      <div className="media-create__top">
        <div>
          <p className="media-create__breadcrumb">MEDIA / ASSETS</p>
          <h1 className="media-create__title">UPLOAD MÚLTIPLO</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {files.length > 0 && (
            <span style={{ fontSize: '13px', color: 'var(--theme-elevation-500)' }}>
              {doneCount}/{files.length} carregados
              {errorCount > 0 && ` · ${errorCount} erros`}
            </span>
          )}
          {allDone ? (
            <a
              href="/admin/collections/media"
              className="media-create__upload-btn"
            >
              CONCLUÍDO
            </a>
          ) : (
            <button
              type="button"
              className="media-create__upload-btn"
              onClick={uploadAll}
              disabled={pendingCount === 0 || uploading}
            >
              {uploading ? 'A CARREGAR...' : `CARREGAR ${pendingCount} FICHEIRO${pendingCount !== 1 ? 'S' : ''}`}
            </button>
          )}
        </div>
      </div>

      {/* Dropzone */}
      <div
        className={`media-create__dropzone ${dragging ? 'media-create__dropzone--dragging' : ''}`}
        style={{ marginBottom: '24px' }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
        </svg>
        <p className="media-create__drop-label">ARRASTA MÚLTIPLAS IMAGENS</p>
        <p className="media-create__drop-hint">JPG, PNG, WEBP, GIF</p>
        <button
          type="button"
          className="media-create__select-btn"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
        >
          SELECIONAR FICHEIROS
        </button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {files.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 16px',
                border: '1px solid var(--theme-elevation-100)',
                borderRadius: '6px',
                background: item.status === 'done'
                  ? 'rgba(34,197,94,0.05)'
                  : item.status === 'error'
                    ? 'rgba(239,68,68,0.05)'
                    : 'var(--theme-elevation-0)',
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--theme-elevation-50)',
                }}
              >
                {item.preview && (
                  <img
                    src={item.preview}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Filename */}
              <div style={{ flex: '0 0 180px', fontSize: '13px', color: 'var(--theme-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.file.name}
              </div>

              {/* Alt input */}
              <input
                type="text"
                value={item.alt}
                onChange={(e) => updateAlt(item.id, e.target.value)}
                placeholder="Texto alt"
                disabled={item.status !== 'pending'}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: '13px',
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: '4px',
                  background: 'var(--theme-elevation-0)',
                  color: 'var(--theme-text)',
                }}
              />

              {/* Status */}
              <div style={{ width: '80px', textAlign: 'center', fontSize: '12px', flexShrink: 0 }}>
                {item.status === 'pending' && (
                  <span style={{ color: 'var(--theme-elevation-500)' }}>Pendente</span>
                )}
                {item.status === 'uploading' && (
                  <span style={{ color: 'var(--theme-elevation-500)' }}>A carregar...</span>
                )}
                {item.status === 'done' && (
                  <span style={{ color: '#22c55e' }}>Concluído</span>
                )}
                {item.status === 'error' && (
                  <span style={{ color: '#ef4444' }} title={item.error}>Erro</span>
                )}
              </div>

              {/* Remove */}
              {item.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--theme-elevation-500)',
                    padding: '4px',
                  }}
                  title="Remover"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
