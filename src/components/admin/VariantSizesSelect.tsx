'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useField, useAllFormFields } from '@payloadcms/ui'

type SizeDoc = { id: number; name: string }

type RelValue = number | string | { id: number } | { value: number | string }

/**
 * Multi-select pills for the per-variant `sizes` relationship.
 * Lists the sizes the parent product has selected (via the top-level
 * `sizes` field) and lets the user toggle which subset this single
 * variant covers — so one variant can serve multiple sizes that share
 * the same price/availability.
 */
export const VariantSizesSelect: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<RelValue[] | null>({ path })
  const [fields] = useAllFormFields()
  const [library, setLibrary] = useState<Record<number, SizeDoc>>({})

  useEffect(() => {
    let cancelled = false
    fetch('/api/sizes?limit=1000&depth=0', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.docs) return
        const map: Record<number, SizeDoc> = {}
        for (const doc of data.docs) {
          map[doc.id] = { id: doc.id, name: doc.name }
        }
        setLibrary(map)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // The sizes the parent product enabled — we only allow selecting from those
  const allowedIds = useMemo<number[]>(() => {
    const out: number[] = []
    if (!fields) return out
    const raw = fields['sizes']?.value
    if (Array.isArray(raw)) {
      for (const v of raw) {
        if (typeof v === 'number') out.push(v)
        else if (typeof v === 'string' && /^\d+$/.test(v)) out.push(parseInt(v, 10))
        else if (v && typeof v === 'object' && 'id' in v && typeof (v as any).id === 'number') {
          out.push((v as any).id)
        }
      }
    }
    return out
  }, [fields])

  const selectedIds = useMemo(() => {
    const out = new Set<number>()
    if (Array.isArray(value)) {
      for (const v of value) {
        if (typeof v === 'number') out.add(v)
        else if (typeof v === 'string' && /^\d+$/.test(v)) out.add(parseInt(v, 10))
        else if (v && typeof v === 'object') {
          const obj = v as any
          if (typeof obj.id === 'number') out.add(obj.id)
          else if (typeof obj.value === 'number') out.add(obj.value)
          else if (typeof obj.value === 'string' && /^\d+$/.test(obj.value)) out.add(parseInt(obj.value, 10))
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
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--theme-elevation-500)',
  }

  if (allowedIds.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={labelStyle}>Tamanhos</label>
        <p style={{ fontSize: '13px', color: 'var(--theme-elevation-400)' }}>
          Seleciona tamanhos no Passo 2 (Tamanhos disponíveis) acima.
        </p>
      </div>
    )
  }

  const options = allowedIds.map((id) => library[id]).filter(Boolean) as SizeDoc[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={labelStyle}>Tamanhos</label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const selected = selectedIds.has(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              style={{
                minWidth: '44px',
                padding: '6px 12px',
                border: selected
                  ? '2px solid var(--theme-text)'
                  : '1px solid var(--theme-elevation-200)',
                borderRadius: '4px',
                background: selected ? 'var(--theme-elevation-50)' : 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--theme-text)',
                textAlign: 'center',
                fontWeight: selected ? 600 : 400,
              }}
            >
              {opt.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
