'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useField } from '@payloadcms/ui'

type ColorDoc = { id: number; name: string; hex: string }

/**
 * Custom Field replacement for the Products `colors` relationship.
 * Renders each available color from the global library as a clickable
 * pill with a visible swatch — clicking toggles inclusion in the hasMany
 * relationship value.
 */
export const ProductColorsField: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<(number | string | { id: number })[] | null>({ path })
  const [library, setLibrary] = useState<ColorDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/colors?limit=1000&depth=0&sort=name', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.docs) return
        setLibrary(
          data.docs.map((d: any) => ({ id: d.id, name: d.name, hex: d.hex })),
        )
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Normalize value into a Set of numeric ids
  const selectedIds = useMemo(() => {
    const out = new Set<number>()
    if (Array.isArray(value)) {
      for (const v of value) {
        if (typeof v === 'number') out.add(v)
        else if (typeof v === 'string' && /^\d+$/.test(v)) out.add(parseInt(v, 10))
        else if (v && typeof v === 'object' && typeof (v as any).id === 'number') {
          out.add((v as any).id)
        }
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
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--theme-text)',
    marginBottom: '8px',
    display: 'block',
  }

  const descStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--theme-elevation-500)',
    marginBottom: '12px',
  }

  if (loading) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Cores disponíveis</label>
        <p style={descStyle}>A carregar biblioteca de cores...</p>
      </div>
    )
  }

  if (library.length === 0) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Cores disponíveis</label>
        <p style={descStyle}>
          Não há cores na biblioteca. Cria cores em{' '}
          <a href="/admin/collections/colors" style={{ color: 'var(--theme-success-500)' }}>
            Cores
          </a>{' '}
          primeiro.
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={labelStyle}>Passo 2 — Cores disponíveis</label>
      <p style={descStyle}>
        Clica nas cores que este produto deve ter. Gere a biblioteca em{' '}
        <a href="/admin/collections/colors" style={{ color: 'var(--theme-success-500)' }}>
          Cores
        </a>
        .
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {library.map((color) => {
          const selected = selectedIds.has(color.id)
          return (
            <button
              key={color.id}
              type="button"
              onClick={() => toggle(color.id)}
              title={color.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px 8px 8px',
                border: selected
                  ? '2px solid var(--theme-success-500)'
                  : '1px solid var(--theme-elevation-200)',
                borderRadius: '6px',
                background: selected
                  ? 'var(--theme-success-50, var(--theme-elevation-50))'
                  : 'var(--theme-elevation-0)',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--theme-text)',
                fontWeight: selected ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  backgroundColor: color.hex,
                  border: '1px solid var(--theme-elevation-200)',
                  flexShrink: 0,
                }}
              />
              {color.name}
              {selected && (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
