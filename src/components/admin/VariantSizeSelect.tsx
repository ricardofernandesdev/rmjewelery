'use client'
import React from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

export const VariantSizeSelect: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })

  const sizeTermsField = useFormFields(([fields]) => fields['sizeTerms'])
  const sizeTerms: any[] = (sizeTermsField?.value as any[]) || []

  const options = sizeTerms
    .filter((t: any) => t?.value)
    .map((t: any) => t.value as string)

  if (options.length === 0) {
    return (
      <div style={{ fontSize: '13px', color: 'var(--theme-elevation-500)', padding: '8px 0' }}>
        Define primeiro os termos de tamanho no Passo 2.
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
