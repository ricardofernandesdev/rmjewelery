'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useField } from '@payloadcms/ui'

type SizeDoc = { id: number; name: string }

export const ProductSizesField: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<(number | string | { id: number })[] | null>({ path })
  const [library, setLibrary] = useState<SizeDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/sizes?limit=1000&depth=0&sort=name', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.docs) return
        setLibrary(data.docs.map((d: any) => ({ id: d.id, name: d.name })))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

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
        <label style={labelStyle}>Passo 2 — Tamanhos disponíveis</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0' }}>
          <span
            style={{
              width: '18px',
              height: '18px',
              border: '2px solid var(--theme-elevation-200)',
              borderTopColor: 'var(--theme-text)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '13px', color: 'var(--theme-elevation-500)' }}>
            A carregar tamanhos...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (library.length === 0) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Tamanhos disponíveis</label>
        <p style={descStyle}>
          Não há tamanhos na biblioteca. Cria tamanhos em{' '}
          <a href="/admin/collections/sizes" style={{ color: 'var(--theme-success-500)' }}>
            Tamanhos
          </a>{' '}
          primeiro.
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={labelStyle}>Passo 2 — Tamanhos disponíveis</label>
      <p style={descStyle}>
        Clica nos tamanhos que este produto deve ter. Gere a biblioteca em{' '}
        <a href="/admin/collections/sizes" style={{ color: 'var(--theme-success-500)' }}>
          Tamanhos
        </a>
        .
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {library.map((size) => {
          const selected = selectedIds.has(size.id)
          return (
            <button
              key={size.id}
              type="button"
              onClick={() => toggle(size.id)}
              title={size.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '48px',
                padding: '8px 14px',
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
                textAlign: 'center',
                justifyContent: 'center',
              }}
            >
              {size.name}
              {selected && (
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden>
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
