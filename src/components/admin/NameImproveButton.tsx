'use client'
import React, { useState } from 'react'
import { useField } from '@payloadcms/ui'

/**
 * Button rendered next to the product name field. Calls the AI to
 * generate a more descriptive name from the current value.
 * Disabled when the field is empty.
 */
export const NameImproveButton: React.FC = () => {
  const { value, setValue } = useField<string>({ path: 'name' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = (value || '').trim()
  const disabled = loading || !trimmed

  const handleClick = async () => {
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/improve-name', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      if (data.name) setValue(data.name)
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar nome')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={trimmed ? 'Gerar nome melhorado com IA' : 'Escreve um nome primeiro'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '4px',
          background: 'transparent',
          color: disabled ? 'var(--theme-elevation-400)' : 'var(--theme-text)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          alignSelf: 'flex-start',
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: '12px',
                height: '12px',
                border: '2px solid var(--theme-elevation-200)',
                borderTopColor: 'currentColor',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                display: 'inline-block',
              }}
            />
            A gerar...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm6 12l.95 2.85L21.8 17.8l-2.85.95L18 21.6l-.95-2.85L14.2 17.8l2.85-.95L18 14zm-12 4l.7 2.1L8.8 20.8l-2.1.7L6 23.6l-.7-2.1L3.2 20.8l2.1-.7L6 18z" />
            </svg>
            Gerar Nome IA
          </>
        )}
      </button>
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--theme-error-500, #ef4444)' }}>{error}</span>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
