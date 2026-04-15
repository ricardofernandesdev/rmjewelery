'use client'
import React, { useEffect, useState } from 'react'
import { useField, useAllFormFields } from '@payloadcms/ui'

type SizeDoc = { id: number; name: string }

export const VariantSizeSelect: React.FC<{ path: string }> = ({ path }) => {
  // Variant.size stores the size id as string (mirrors color handling).
  const { value, setValue } = useField<string>({ path })
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

  const sizeIds: number[] = []
  if (fields) {
    const raw = fields['sizes']?.value
    if (Array.isArray(raw)) {
      for (const v of raw) {
        if (typeof v === 'number') sizeIds.push(v)
        else if (typeof v === 'string' && /^\d+$/.test(v)) sizeIds.push(parseInt(v, 10))
        else if (v && typeof v === 'object' && 'id' in v && typeof (v as any).id === 'number') {
          sizeIds.push((v as any).id)
        }
      }
    }
  }

  const options = sizeIds.map((id) => library[id]).filter(Boolean) as SizeDoc[]

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--theme-elevation-500)',
  }

  if (options.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={labelStyle}>Tamanho</label>
        <p style={{ fontSize: '13px', color: 'var(--theme-elevation-400)' }}>
          Seleciona tamanhos no Passo 2 (Tamanhos disponíveis) acima.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={labelStyle}>Tamanho</label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const selected = value === String(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setValue(String(opt.id))}
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
