'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import './MediaCreate.scss'

export const MediaCreate: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [alt, setAlt] = useState('')
  const [assetName, setAssetName] = useState('')
  const [keepAspectRatio, setKeepAspectRatio] = useState(true)
  const [publicAccess, setPublicAccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Detect edit mode from URL
  useEffect(() => {
    const path = window.location.pathname
    const match = path.match(/\/admin\/collections\/media\/(\d+)/)
    if (match) {
      const id = match[1]
      setEditId(id)
      fetch(`/api/media/${id}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setAlt(data.alt || '')
            setAssetName(data.filename || '')
            const imgUrl = data.sizes?.card?.url || data.sizes?.thumbnail?.url || data.url
            if (imgUrl) setPreview(imgUrl)
          }
          setLoaded(true)
        })
        .catch(() => setLoaded(true))
    } else {
      setLoaded(true)
    }
  }, [])

  const isEdit = Boolean(editId)

  const handleFile = (f: File) => {
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleSubmit = async () => {
    if (!isEdit && !file) return
    setUploading(true)

    try {
      if (isEdit) {
        // Update existing
        if (file) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('_payload', JSON.stringify({ alt }))
          await fetch(`/api/media/${editId}`, {
            method: 'PATCH',
            credentials: 'include',
            body: formData,
          })
        } else {
          await fetch(`/api/media/${editId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alt }),
          })
        }
        window.location.href = '/admin/collections/media'
      } else {
        // Create new
        const formData = new FormData()
        formData.append('file', file!)
        formData.append('_payload', JSON.stringify({ alt: alt || file!.name }))

        const res = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
        if (res.ok) {
          window.location.href = '/admin/collections/media'
        } else {
          const err = await res.json()
          alert(err?.errors?.[0]?.message || 'Erro ao carregar ficheiro')
        }
      }
    } catch {
      alert('Erro de rede')
    } finally {
      setUploading(false)
    }
  }

  if (!loaded) return null

  return (
    <div className="media-create">
      {(isEdit || file) && (
        <div className="media-create__top">
          <div>
            <p className="media-create__breadcrumb">
              {isEdit ? 'MEDIA / EDITAR' : 'MEDIA / ASSETS'}
            </p>
            <h1 className="media-create__title">
              {isEdit ? assetName.toUpperCase() : 'UPLOAD MEDIA'}
            </h1>
          </div>
          <button
            type="button"
            className="media-create__upload-btn"
            onClick={handleSubmit}
            disabled={(!isEdit && !file) || uploading}
          >
            {uploading ? 'A GUARDAR...' : isEdit ? 'GUARDAR' : 'UPLOAD'}
          </button>
        </div>
      )}

      <div className="media-create__layout">
        {/* Left — Dropzone */}
        <div
          className={`media-create__dropzone ${dragging ? 'media-create__dropzone--dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !preview && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          {preview ? (
            <div className="media-create__preview">
              <img src={preview} alt="Preview" />
              <div className="media-create__preview-actions">
                <button
                  type="button"
                  className="media-create__change-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    inputRef.current?.click()
                  }}
                >
                  TROCAR IMAGEM
                </button>
                {!isEdit && (
                  <button
                    type="button"
                    className="media-create__remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setPreview(null)
                    }}
                  >
                    REMOVER
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
              <p className="media-create__drop-label">DRAG & DROP IMAGE</p>
              <p className="media-create__drop-hint">JPG, PNG, WEBP UP TO 10MB</p>
              <button
                type="button"
                className="media-create__select-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  inputRef.current?.click()
                }}
              >
                SELECT FILE
              </button>
            </>
          )}
        </div>

        {/* Right — Form fields */}
        <div className="media-create__fields">
          {isEdit && (
            <div className="media-create__field">
              <label className="media-create__label">NOME DO FICHEIRO</label>
              <input
                type="text"
                className="media-create__input"
                value={assetName}
                disabled
              />
            </div>
          )}

          <div className="media-create__field">
            <label className="media-create__label">TEXTO ALT</label>
            <textarea
              className="media-create__textarea"
              placeholder="DESCREVE ESTA IMAGEM PARA ACESSIBILIDADE"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </div>

          <div className="media-create__toggle-row">
            <div>
              <p className="media-create__toggle-label">ASPECT RATIO ORIGINAL</p>
              <p className="media-create__toggle-hint">PRESERVAR DIMENSÕES ORIGINAIS</p>
            </div>
            <button
              type="button"
              className={`media-create__toggle ${keepAspectRatio ? 'media-create__toggle--on' : ''}`}
              onClick={() => setKeepAspectRatio(!keepAspectRatio)}
            >
              <span className="media-create__toggle-knob" />
            </button>
          </div>

          <div className="media-create__toggle-row">
            <div>
              <p className="media-create__toggle-label">ACESSO PÚBLICO</p>
              <p className="media-create__toggle-hint">GERAR URL PÚBLICO CDN</p>
            </div>
            <button
              type="button"
              className={`media-create__toggle ${publicAccess ? 'media-create__toggle--on' : ''}`}
              onClick={() => setPublicAccess(!publicAccess)}
            >
              <span className="media-create__toggle-knob" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
