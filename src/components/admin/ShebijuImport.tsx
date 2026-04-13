'use client'
import React, { useState } from 'react'

type ImportResult = {
  productId: number
  data: {
    name: string
    ref: string
    imagesUploaded: number
    colors: string[]
    price: number
  }
}

/**
 * Admin UI field that accepts a Shebiju product URL, scrapes the page,
 * uploads images to Media, creates a pre-filled product, and redirects
 * to the edit page.
 */
export const ShebijuImport: React.FC = () => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const handleImport = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setStatus('A abrir página...')

    try {
      setStatus('A extrair dados do produto e imagens... (pode demorar 15-30s)')

      const res = await fetch('/api/import-shebiju', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao importar')
      }

      const result = json as ImportResult
      setStatus(
        `Importado: "${result.data.name}" — ${result.data.imagesUploaded} imagens, ${result.data.colors.length} cores`,
      )

      // Redirect to the newly created product edit page after a brief delay
      setTimeout(() => {
        window.location.href = `/admin/collections/products/${result.productId}`
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido')
      setLoading(false)
      setStatus(null)
    }
  }

  return (
    <div
      style={{
        marginBottom: '24px',
        padding: '16px',
        border: '1px dashed var(--theme-elevation-200)',
        borderRadius: '8px',
        background: 'var(--theme-elevation-0)',
      }}
    >
      <label
        style={{
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--theme-elevation-500)',
          display: 'block',
          marginBottom: '8px',
        }}
      >
        Importar da Shebiju
      </label>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--theme-elevation-400)',
          marginBottom: '12px',
        }}
      >
        Cola o URL de um produto da shebiju.pt para importar automaticamente nome, imagens e
        cores. O produto é criado e podes editar antes de publicar.
      </p>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.shebiju.pt/pt/..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '13px',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '4px',
            background: 'var(--theme-input-bg, var(--theme-elevation-50))',
            color: 'var(--theme-text)',
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) handleImport()
          }}
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !url.trim()}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'wait' : 'pointer',
            background: loading ? 'var(--theme-elevation-200)' : 'var(--theme-text)',
            color: loading ? 'var(--theme-elevation-500)' : 'var(--theme-bg)',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid var(--theme-elevation-300)',
                  borderTopColor: 'var(--theme-elevation-500)',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
              A importar...
            </span>
          ) : (
            'Importar'
          )}
        </button>
      </div>

      {status && (
        <p
          style={{
            marginTop: '10px',
            fontSize: '13px',
            color: 'var(--theme-success-500, #22c55e)',
          }}
        >
          {status}
        </p>
      )}

      {error && (
        <p
          style={{
            marginTop: '10px',
            fontSize: '13px',
            color: 'var(--theme-error-500, #ef4444)',
          }}
        >
          {error}
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
