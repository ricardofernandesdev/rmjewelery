'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useField, useAllFormFields } from '@payloadcms/ui'

type MediaDoc = { id: number; url: string; thumbnailUrl: string; alt: string; filename: string }

/**
 * Custom Field replacement for variant `images` (hasMany upload).
 * Instead of opening the full media library, it shows only the images
 * already uploaded to the product's main gallery and lets the user
 * toggle which ones belong to this variant.
 */
export const VariantImagesPicker: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<(number | { id: number })[]>({ path })
  const [fields] = useAllFormFields()
  const [mediaMap, setMediaMap] = useState<Record<number, MediaDoc>>({})
  const [loading, setLoading] = useState(false)

  // Read the product's main `images` field (array of media IDs or objects)
  const galleryIds: number[] = useMemo(() => {
    const ids: number[] = []
    if (!fields) return ids

    function pushId(v: any) {
      if (typeof v === 'number') ids.push(v)
      else if (typeof v === 'string' && /^\d+$/.test(v)) ids.push(parseInt(v, 10))
      else if (v && typeof v === 'object' && 'id' in v) ids.push(v.id)
    }

    // Try reading as single array value first (e.g. after setValue)
    const raw = fields['images']?.value
    if (Array.isArray(raw)) {
      raw.forEach(pushId)
      return ids
    }

    // Fallback: read indexed fields (images.0, images.1, ...)
    let i = 0
    while (true) {
      const field = fields[`images.${i}`]
      if (!field) break
      pushId(field.value)
      i++
    }
    return ids
  }, [fields])

  // Fetch media docs for the gallery IDs
  useEffect(() => {
    if (galleryIds.length === 0) {
      setMediaMap({})
      return
    }

    let cancelled = false
    setLoading(true)

    const qs = galleryIds.map((id) => `where[id][in]=${id}`).join('&')
    fetch(`/api/media?${qs}&limit=100&depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.docs) return
        const map: Record<number, MediaDoc> = {}
        for (const doc of data.docs) {
          map[doc.id] = {
            id: doc.id,
            url: doc.url || '',
            thumbnailUrl: doc.sizes?.thumbnail?.url || doc.url || '',
            alt: doc.alt || '',
            filename: doc.filename || '',
          }
        }
        setMediaMap(map)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [galleryIds.join(',')])

  // Normalize current value into a Set of IDs
  const selectedIds = useMemo(() => {
    const out = new Set<number>()
    if (Array.isArray(value)) {
      for (const v of value) {
        if (typeof v === 'number') out.add(v)
        else if (typeof v === 'string' && /^\d+$/.test(v)) out.add(parseInt(v, 10))
        else if (v && typeof v === 'object' && 'id' in v) out.add((v as any).id)
      }
    }
    return out
  }, [value])

  const toggle = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setValue(Array.from(next))
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--theme-elevation-500)',
    marginBottom: '6px',
    display: 'block',
  }

  if (galleryIds.length === 0) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Imagens desta variante</label>
        <p style={{ fontSize: '13px', color: 'var(--theme-elevation-400)' }}>
          Adiciona imagens à galeria do produto primeiro.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Imagens desta variante</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
          <span
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--theme-elevation-200)',
              borderTopColor: 'var(--theme-text)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '13px', color: 'var(--theme-elevation-500)' }}>
            A carregar imagens...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>Imagens desta variante</label>
      <p style={{ fontSize: '12px', color: 'var(--theme-elevation-400)', marginBottom: '10px' }}>
        Seleciona da galeria do produto. Se vazio, usa as imagens principais.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {galleryIds.map((id) => {
          const media = mediaMap[id]
          if (!media) return null
          const selected = selectedIds.has(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              title={media.filename}
              style={{
                position: 'relative',
                width: '72px',
                height: '72px',
                padding: 0,
                border: selected
                  ? '3px solid var(--theme-success-500, #22c55e)'
                  : '2px solid var(--theme-elevation-200)',
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'var(--theme-elevation-0)',
                transition: 'border-color 0.15s',
              }}
            >
              <img
                src={media.thumbnailUrl}
                alt={media.alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: selected ? 1 : 0.6,
                  transition: 'opacity 0.15s',
                }}
              />
              {selected && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'var(--theme-success-500, #22c55e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
