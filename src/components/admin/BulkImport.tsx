'use client'
import React, { useState, useEffect } from 'react'

type Category = { id: number; name: string }
type ImportStatus = {
  url: string
  status: 'pending' | 'scraping' | 'uploading' | 'creating' | 'done' | 'error'
  name?: string
  error?: string
  imagesDone?: number
  imagesTotal?: number
}

export const BulkImport: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [urls, setUrls] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [allColorIds, setAllColorIds] = useState<number[]>([])
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<ImportStatus[]>([])

  useEffect(() => {
    if (!open) return
    fetch('/api/categories?limit=100&depth=0&sort=name', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.docs) setCategories(d.docs.map((c: any) => ({ id: c.id, name: c.name }))) })
      .catch(() => {})

    fetch('/api/colors?limit=100&depth=0&sort=name', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.docs) setAllColorIds(d.docs.map((c: any) => c.id)) })
      .catch(() => {})
  }, [open])

  const updateResult = (index: number, patch: Partial<ImportStatus>) => {
    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const importProduct = async (url: string, index: number) => {
    try {
      // 1. Scrape
      updateResult(index, { status: 'scraping' })
      const scrapeRes = await fetch('/api/import-shebiju/scrape', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const scrapeData = await scrapeRes.json()
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Erro ao extrair')

      const productName = scrapeData.name || scrapeData.ref || 'Produto'
      updateResult(index, { name: productName, status: 'uploading', imagesTotal: scrapeData.imageUrls.length, imagesDone: 0 })

      // 2. Upload images one by one
      const mediaIds: number[] = []
      for (let i = 0; i < scrapeData.imageUrls.length; i++) {
        try {
          const uploadRes = await fetch('/api/import-shebiju/upload-image', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: scrapeData.imageUrls[i],
              altText: scrapeData.ref || scrapeData.name,
              index: i + 1,
            }),
          })
          const uploadData = await uploadRes.json()
          if (uploadRes.ok && uploadData.mediaId) mediaIds.push(uploadData.mediaId)
        } catch { /* skip */ }
        updateResult(index, { imagesDone: i + 1 })
      }

      if (mediaIds.length === 0) throw new Error('Nenhuma imagem carregada')

      // 3. Enhance name + description with Gemini (single request, ≤10s)
      let finalName = productName
      let enhancedDescription: any = null
      try {
        const enhanceRes = await fetch('/api/import-shebiju/enhance', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: productName,
            imageUrl: scrapeData.imageUrls[0],
          }),
        })
        const enhanceData = await enhanceRes.json()
        if (enhanceRes.ok) {
          if (enhanceData.name) finalName = enhanceData.name
          if (enhanceData.description) enhancedDescription = enhanceData.description
        }
      } catch {
        // Keep original name; server hook will generate template description
      }

      // 4. Create product via Payload REST API
      updateResult(index, { status: 'creating', name: finalName })

      const productData: any = {
        name: finalName,
        slug: scrapeData.ref || undefined,
        images: mediaIds,
        price: scrapeData.price || 0,
        availability: 'in_stock',
        category: categoryId,
        enableColors: allColorIds.length > 0,
        ...(enhancedDescription ? { description: enhancedDescription } : {}),
      }

      // Add colors + variants
      if (allColorIds.length > 0) {
        productData.colors = allColorIds
        productData.variants = allColorIds.map((colorId: number) => ({
          color: String(colorId),
          availability: 'in_stock',
        }))
      }

      const createRes = await fetch('/api/products', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      if (!createRes.ok) {
        const err = await createRes.json()
        throw new Error(err.errors?.[0]?.message || 'Erro ao criar produto')
      }

      updateResult(index, { status: 'done' })
    } catch (err: any) {
      updateResult(index, { status: 'error', error: err.message })
    }
  }

  const handleBulkImport = async () => {
    const urlList = urls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && u.includes('shebiju.pt'))

    if (urlList.length === 0) return
    if (!categoryId) return

    setRunning(true)
    setResults(urlList.map((url) => ({ url, status: 'pending' })))

    for (let i = 0; i < urlList.length; i++) {
      await importProduct(urlList[i], i)
      // Gemini free tier is 5 RPM — wait 13s before next product so the
      // enhance step doesn't hit the per-minute rate limit. No delay
      // after the last one.
      if (i < urlList.length - 1) {
        await new Promise((r) => setTimeout(r, 13000))
      }
    }

    setRunning(false)
  }

  const doneCount = results.filter((r) => r.status === 'done').length
  const errorCount = results.filter((r) => r.status === 'error').length

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="media-list__btn"
        style={{ fontSize: '11px', letterSpacing: '1px' }}
      >
        IMPORTAR VÁRIOS
      </button>
    )
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: '13px',
    border: '1px solid var(--theme-elevation-200)',
    borderRadius: '4px',
    background: 'var(--theme-input-bg, var(--theme-elevation-50))',
    color: 'var(--theme-text)',
    outline: 'none',
    width: '100%',
  }

  return (
    <div
      style={{
        marginBottom: '24px',
        padding: '20px',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '8px',
        background: 'var(--theme-elevation-0)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--theme-text)' }}>
          Importar Vários Produtos
        </label>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-elevation-500)', fontSize: '18px' }}>
          ✕
        </button>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--theme-elevation-400)', marginBottom: '12px' }}>
        Cola os URLs da Shebiju (um por linha). Cada produto é importado e salvo automaticamente.
      </p>

      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder={'https://www.shebiju.pt/pt/produto-1\nhttps://www.shebiju.pt/pt/produto-2\nhttps://www.shebiju.pt/pt/produto-3'}
        disabled={running}
        rows={5}
        style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px', fontFamily: 'monospace' }}
      />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <select
          value={categoryId || ''}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
          disabled={running}
          style={{ ...inputStyle, width: 'auto', minWidth: '180px' }}
        >
          <option value="">Categoria...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleBulkImport}
          disabled={running || !categoryId || !urls.trim()}
          style={{
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            border: 'none',
            borderRadius: '4px',
            cursor: running ? 'wait' : 'pointer',
            background: running ? 'var(--theme-elevation-200)' : 'var(--theme-text)',
            color: running ? 'var(--theme-elevation-500)' : 'var(--theme-bg)',
            whiteSpace: 'nowrap',
          }}
        >
          {running ? 'A importar...' : 'Importar Todos'}
        </button>
      </div>

      {/* Progress */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {!running && results.length > 0 && (
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text)', marginBottom: '4px' }}>
              {doneCount} importado(s){errorCount > 0 ? `, ${errorCount} com erro` : ''}
            </p>
          )}
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                background: r.status === 'done'
                  ? 'var(--theme-success-100, rgba(34,197,94,0.1))'
                  : r.status === 'error'
                    ? 'var(--theme-error-100, rgba(239,68,68,0.1))'
                    : 'var(--theme-elevation-50)',
              }}
            >
              {/* Status indicator */}
              {r.status === 'pending' && <span style={{ color: 'var(--theme-elevation-400)' }}>○</span>}
              {(r.status === 'scraping' || r.status === 'uploading' || r.status === 'creating') && (
                <span style={{ width: 14, height: 14, border: '2px solid var(--theme-elevation-200)', borderTopColor: 'var(--theme-text)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block', flexShrink: 0 }} />
              )}
              {r.status === 'done' && <span style={{ color: 'var(--theme-success-500, #22c55e)' }}>✓</span>}
              {r.status === 'error' && <span style={{ color: 'var(--theme-error-500, #ef4444)' }}>✗</span>}

              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.name || r.url.replace('https://www.shebiju.pt/pt/', '')}
              </span>

              <span style={{ color: 'var(--theme-elevation-400)', flexShrink: 0 }}>
                {r.status === 'scraping' && 'A extrair...'}
                {r.status === 'uploading' && `Imagem ${r.imagesDone || 0}/${r.imagesTotal || '?'}`}
                {r.status === 'creating' && 'A guardar...'}
                {r.status === 'done' && 'OK'}
                {r.status === 'error' && r.error}
              </span>
            </div>
          ))}
        </div>
      )}

      {!running && doneCount > 0 && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '4px',
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--theme-text)',
            width: '100%',
          }}
        >
          Atualizar Lista
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
