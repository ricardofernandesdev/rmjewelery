'use client'
import React from 'react'
import { useField } from '@payloadcms/ui'

export const ColorPickerField: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label
        style={{
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--theme-elevation-500)',
        }}
      >
        Cor
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="color"
          value={value || '#cccccc'}
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: '48px',
            height: '48px',
            padding: '2px',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '6px',
            cursor: 'pointer',
            background: 'var(--theme-elevation-0)',
          }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#000000"
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '4px',
            background: 'var(--theme-elevation-0)',
            color: 'var(--theme-text)',
            fontFamily: 'monospace',
          }}
        />
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: value || '#cccccc',
            border: '1px solid var(--theme-elevation-200)',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  )
}
