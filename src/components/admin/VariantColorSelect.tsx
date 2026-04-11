'use client'
import React, { useEffect, useState } from 'react'
import { useField, useAllFormFields } from '@payloadcms/ui'

type ColorDoc = { id: number; name: string; hex: string }

export const VariantColorSelect: React.FC<{ path: string }> = ({ path }) => {
  // Variant.color field stores the color id as a string so we can keep the
  // existing text column in products_variants instead of turning this into
  // a true relationship field inside an array.
  const { value, setValue } = useField<string>({ path })
  const [fields] = useAllFormFields()
  const [library, setLibrary] = useState<Record<number, ColorDoc>>({})

  useEffect(() => {
    let cancelled = false
    fetch('/api/colors?limit=1000&depth=0', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.docs) return
        const map: Record<number, ColorDoc> = {}
        for (const doc of data.docs) {
          map[doc.id] = { id: doc.id, name: doc.name, hex: doc.hex }
        }
        setLibrary(map)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Read the sibling `colors` relationship field from live form state.
  // Payload stores hasMany relationship values as an array of ids (numbers)
  // or an array of populated objects depending on how the form was seeded.
  const colorIds: number[] = []
  if (fields) {
    const raw = fields['colors']?.value
    if (Array.isArray(raw)) {
      for (const v of raw) {
        if (typeof v === 'number') colorIds.push(v)
        else if (typeof v === 'string' && /^\d+$/.test(v)) colorIds.push(parseInt(v, 10))
        else if (v && typeof v === 'object' && 'id' in v && typeof (v as any).id === 'number') {
          colorIds.push((v as any).id)
        }
      }
    }
  }

  const options = colorIds.map((id) => library[id]).filter(Boolean) as ColorDoc[]

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
        <label style={labelStyle}>Cor</label>
        <p style={{ fontSize: '13px', color: 'var(--theme-elevation-400)' }}>
          Seleciona cores no Passo 2 (Cores disponíveis) acima.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={labelStyle}>Cor</label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const selected = value === String(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setValue(String(opt.id))}
              title={opt.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                border: selected
                  ? '2px solid var(--theme-text)'
                  : '1px solid var(--theme-elevation-200)',
                borderRadius: '4px',
                background: selected ? 'var(--theme-elevation-50)' : 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--theme-text)',
              }}
            >
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: opt.hex,
                  border: '1px solid var(--theme-elevation-200)',
                  flexShrink: 0,
                }}
              />
              {opt.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
