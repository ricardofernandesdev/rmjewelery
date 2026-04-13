'use client'
import React, { useState, useEffect } from 'react'

type ScrapeResult = {
  name: string
  ref: string
  imageUrls: string[]
  colors: string[]
  price: number
}

type Category = { id: number; name: string }

export const ShebijuImport: React.FC = () => {
  const [url, setUrl] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<string | null>(null)

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories?limit=100&depth=0&sort=name', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.docs) setCategories(data.docs.map((d: any) => ({ id: d.id, name: d.name })))
      })
      .catch(() => {})
  }, [])

  const handleImport = async () => {
    if (!url.trim()) return
    if (!categoryId) {
      setError('Seleciona uma categoria antes de importar.')
      return
    }
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

      // ── Step 2: Upload images one by one ──
      const mediaIds: number[] = []
      const totalImages = result.imageUrls.length

      for (let i = 0; i < totalImages; i++) {
        setStep(`2/3 — A carregar imagem ${i + 1} de ${totalImages}...`)
        try {
          const uploadRes = await fetch('/api/import-shebiju/upload-image', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: result.imageUrls[i],
              altText: result.ref || result.name,
              index: i + 1,
            }),
          })
          const uploadData = await uploadRes.json()
          if (uploadRes.ok && uploadData.mediaId) {
            mediaIds.push(uploadData.mediaId)
          }
        } catch {
          // Skip failed, continue
        }
      }

      if (mediaIds.length === 0) {
        throw new Error('Nenhuma imagem foi carregada com sucesso.')
      }

      // ── Step 3: Create product with images + category ──
      setStep('3/3 — A criar produto...')
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
          categoryId,
          mediaIds,
        }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || 'Erro ao criar produto')

      setStep(`Importado com ${mediaIds.length} imagens. A redirecionar...`)
      setTimeout(() => {
        window.location.href = `/admin/collections/products/${createData.productId}`
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido')
      setLoading(false)
      setStep(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: '13px',
    border: '1px solid var(--theme-elevation-200)',
    borderRadius: '4px',
    background: 'var(--theme-input-bg, var(--theme-elevation-50))',
    color: 'var(--theme-text)',
    outline: 'none',
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
        Cola o URL de um produto da shebiju.pt, seleciona a categoria, e importa automaticamente.
      </p>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.shebiju.pt/pt/..."
          disabled={loading}
          style={{ ...inputStyle, flex: '1 1 250px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) handleImport()
          }}
        />
        <select
          value={categoryId || ''}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
          disabled={loading}
          style={{ ...inputStyle, minWidth: '160px' }}
        >
          <option value="">Categoria...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
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
