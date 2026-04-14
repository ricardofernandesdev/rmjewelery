'use client'
import React, { useState } from 'react'
import { useField, useAllFormFields } from '@payloadcms/ui'

/**
 * Button rendered near the product description field. Generates a
 * 2-paragraph description via Gemini (with vision) from the product
 * name + first image, and writes it into the Lexical richText field.
 */
export const DescriptionGenerateButton: React.FC = () => {
  const [fields] = useAllFormFields()
  const { value: nameValue } = useField<string>({ path: 'name' })
  const { setValue: setDescription } = useField<any>({ path: 'description' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const trimmedName = (nameValue || '').trim()
  const disabled = loading || !trimmedName

  const resolveFirstImageUrl = async (): Promise<string | null> => {
    if (!fields) return null
    const raw = fields['images']?.value ?? fields['images.0']?.value
    let firstId: number | null = null
    if (Array.isArray(raw) && raw.length > 0) {
      const v = raw[0]
      if (typeof v === 'number') firstId = v
      else if (typeof v === 'string' && /^\d+$/.test(v)) firstId = parseInt(v, 10)
      else if (v && typeof v === 'object' && 'id' in v) firstId = (v as any).id
    } else if (typeof raw === 'number') {
      firstId = raw
    }
    if (firstId == null) return null
    try {
      const res = await fetch(`/api/media/${firstId}?depth=0`, { credentials: 'include' })
      if (!res.ok) return null
      const doc = await res.json()
      return doc?.url || null
    } catch {
      return null
    }
  }

  const handleClick = async () => {
    if (!trimmedName) return
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const imageUrl = await resolveFirstImageUrl()
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, imageUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')

      if (data.description) setDescription(data.description)
      if (data.preview) setPreview(data.preview)
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar descrição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={trimmedName ? 'Gerar descrição com IA baseada no nome e imagem' : 'Escreve o nome do produto primeiro'}
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
                animation: 'desc-spin 0.6s linear infinite',
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
            Gerar Descrição IA
          </>
        )}
      </button>

      {error && (
        <span style={{ fontSize: '11px', color: 'var(--theme-error-500, #ef4444)' }}>{error}</span>
      )}

      {preview && (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '4px',
            fontSize: '12px',
            lineHeight: '1.5',
            color: 'var(--theme-elevation-700)',
            whiteSpace: 'pre-line',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--theme-success-500, #22c55e)', marginBottom: '6px' }}>
            Descrição gerada ✓
          </div>
          {preview}
        </div>
      )}

      <style>{`@keyframes desc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
