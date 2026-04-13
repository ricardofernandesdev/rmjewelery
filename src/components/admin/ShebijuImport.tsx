'use client'
import React, { useState } from 'react'

type ScrapeResult = {
  name: string
  ref: string
  imageUrls: string[]
  colors: string[]
  price: number
}

export const ShebijuImport: React.FC = () => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<string | null>(null)

  const handleImport = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)

    try {
      // ── Step 1: Scrape ──
      setStep('1/3 — A extrair dados do produto...')

      const scrapeRes = await fetch('/api/import-shebiju/scrape', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const scrapeData = await scrapeRes.json()
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Erro ao extrair dados')
      const result = scrapeData as ScrapeResult

      // ── Step 2: Create product (no images) ──
      setStep(`2/3 — A criar produto "${result.name || result.ref}"...`)

      const createRes = await fetch('/api/import-shebiju/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name,
          ref: result.ref,
          colors: result.colors,
          price: result.price,
          sourceUrl: url.trim(),
        }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || 'Erro ao criar produto')

      const productId = createData.productId
      const totalImages = result.imageUrls.length

      // ── Step 3: Upload images one by one ──
      let uploaded = 0
      for (let i = 0; i < totalImages; i++) {
        setStep(`3/3 — A carregar imagem ${i + 1} de ${totalImages}...`)

        try {
          const uploadRes = await fetch('/api/import-shebiju/upload-image', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: result.imageUrls[i],
              productId,
              productName: result.ref || result.name,
              index: i + 1,
            }),
          })
          if (uploadRes.ok) uploaded++
        } catch {
          // Skip failed images, continue with others
        }
      }

      setStep(`Importado com ${uploaded}/${totalImages} imagens. A redirecionar...`)

      setTimeout(() => {
        window.location.href = `/admin/collections/products/${productId}`
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido')
      setLoading(false)
      setStep(null)
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
      <p style={{ fontSize: '12px', color: 'var(--theme-elevation-400)', marginBottom: '12px' }}>
        Cola o URL de um produto da shebiju.pt para importar automaticamente nome, descrição,
        imagens e cores.
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

      {step && (
        <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--theme-success-500, #22c55e)' }}>
          {step}
        </p>
      )}
      {error && (
        <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--theme-error-500, #ef4444)' }}>
          {error}
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
