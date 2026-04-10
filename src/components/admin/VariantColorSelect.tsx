'use client'
import React from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

export const VariantColorSelect: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })

  // Read colorTerms from the form
  const colorTermsField = useFormFields(([fields]) => fields['colorTerms'])
  const colorTerms: any[] = (colorTermsField?.value as any[]) || []

  const options = colorTerms
    .filter((t: any) => t?.name)
    .map((t: any) => ({ name: t.name, hex: t.hex || '#ccc' }))

  if (options.length === 0) {
    return (
      <div style={{ fontSize: '13px', color: 'var(--theme-elevation-500)', padding: '8px 0' }}>
        Define primeiro os termos de cor no Passo 2.
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
