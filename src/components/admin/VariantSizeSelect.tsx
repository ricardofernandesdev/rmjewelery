'use client'
import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'

export const VariantSizeSelect: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const [options, setOptions] = useState<string[]>([])

  useEffect(() => {
    const productId = window.location.pathname.match(/\/products\/(\d+)/)?.[1]
    if (productId) {
      fetch(`/api/products/${productId}?depth=0`, { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data?.sizeTerms && Array.isArray(data.sizeTerms)) {
            setOptions(
              data.sizeTerms
                .map((t: any) => t.value as string)
                .filter(Boolean)
            )
          }
        })
        .catch(() => {})
    }
  }, [])

  if (options.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--theme-elevation-500)' }}>
          Tamanho
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Guarda o produto primeiro com os termos de tamanho"
          style={{
            padding: '8px 12px',
            fontSize: '13px',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '4px',
            background: 'var(--theme-elevation-0)',
            color: 'var(--theme-text)',
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--theme-elevation-500)' }}>
        Tamanho
      </label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setValue(opt)}
            style={{
              minWidth: '44px',
              padding: '6px 12px',
              border: value === opt ? '2px solid var(--theme-text)' : '1px solid var(--theme-elevation-200)',
              borderRadius: '4px',
              background: value === opt ? 'var(--theme-elevation-50)' : 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--theme-text)',
              textAlign: 'center',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
