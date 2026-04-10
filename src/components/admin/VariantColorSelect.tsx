'use client'
import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'

export const VariantColorSelect: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const [options, setOptions] = useState<Array<{ name: string; hex: string }>>([])

  useEffect(() => {
    // Read colorTerms from the DOM form data
    const interval = setInterval(() => {
      try {
        const formEl = document.querySelector('form.collection-edit, form.global-edit, [class*="Form"]')
        if (!formEl) return

        // Find all colorTerms name inputs
        const nameInputs = document.querySelectorAll('[id*="colorTerms"][id*="name"] input, [name*="colorTerms"][name*="name"]')
        const hexInputs = document.querySelectorAll('[id*="colorTerms"][id*="hex"] input, [name*="colorTerms"][name*="hex"]')

        if (nameInputs.length === 0) {
          // Try alternative: look at the Payload form state via window
          const stateEl = document.querySelectorAll('[data-path*="colorTerms"]')
          if (stateEl.length > 0) return
        }

        // Fallback: read from the API
        const productId = window.location.pathname.match(/\/products\/(\d+)/)?.[1]
        if (productId && options.length === 0) {
          fetch(`/api/products/${productId}?depth=0`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
              if (data?.colorTerms && Array.isArray(data.colorTerms)) {
                setOptions(data.colorTerms.map((t: any) => ({
                  name: t.name || '',
                  hex: t.hex || '#ccc',
                })).filter((t: any) => t.name))
              }
            })
            .catch(() => {})
        }
      } catch {
        // ignore
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Also try fetching on mount
  useEffect(() => {
    const productId = window.location.pathname.match(/\/products\/(\d+)/)?.[1]
    if (productId) {
      fetch(`/api/products/${productId}?depth=0`, { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data?.colorTerms && Array.isArray(data.colorTerms)) {
            setOptions(data.colorTerms.map((t: any) => ({
              name: t.name || '',
              hex: t.hex || '#ccc',
            })).filter((t: any) => t.name))
          }
        })
        .catch(() => {})
    }
  }, [])

  if (options.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--theme-elevation-500)' }}>
          Cor
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Guarda o produto primeiro com os termos de cor"
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
        Cor
      </label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <button
            key={opt.name}
            type="button"
            onClick={() => setValue(opt.name)}
            title={opt.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              border: value === opt.name ? '2px solid var(--theme-text)' : '1px solid var(--theme-elevation-200)',
              borderRadius: '4px',
              background: value === opt.name ? 'var(--theme-elevation-50)' : 'transparent',
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
        ))}
      </div>
    </div>
  )
}
