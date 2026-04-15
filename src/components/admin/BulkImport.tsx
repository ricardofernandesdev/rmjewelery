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
  const [defaultColorIds, setDefaultColorIds] = useState<number[]>([])
  const [defaultSizeIds, setDefaultSizeIds] = useState<number[]>([])
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<ImportStatus[]>([])

  useEffect(() => {
    if (!open) return
    fetch('/api/categories?limit=100&depth=0&sort=name', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.docs) setCategories(d.docs.map((c: any) => ({ id: c.id, name: c.name }))) })
      .catch(() => {})

    fetch('/api/colors?where[autoSelect][equals]=true&limit=100&depth=0&sort=name', {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.docs) setDefaultColorIds(d.docs.map((c: any) => c.id)) })
      .catch(() => {})

    fetch('/api/sizes?where[autoSelect][equals]=true&limit=100&depth=0&sort=name', {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.docs) setDefaultSizeIds(d.docs.map((s: any) => s.id)) })
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

      // No AI enhancement — keep the raw Shebiju name. Server-side hook
      // still fills the description with the category template on save.
      const finalName = productName

      // 3. Create product via Payload REST API
      updateResult(index, { status: 'creating', name: finalName })

      const productData: any = {
        name: finalName,
        slug: scrapeData.ref || undefined,
        images: mediaIds,
        price: scrapeData.price || 0,
        availability: 'in_stock',
        category: categoryId,
        enableColors: defaultColorIds.length > 0,
        enableSizes: defaultSizeIds.length > 0,
      }

      // Pre-select auto-flagged colors/sizes. Each variant covers ONE
      // color but may span every default size (variant.sizes is hasMany)
      // — that way one Dourado variant serves S/M/L at the same price.
      if (defaultColorIds.length > 0) productData.colors = defaultColorIds
      if (defaultSizeIds.length > 0) productData.sizes = defaultSizeIds

      const variants: Array<{ color?: string; sizes?: number[]; availability: string }> = []
      if (defaultColorIds.length > 0) {
        for (const colorId of defaultColorIds) {
          variants.push({
            color: String(colorId),
            ...(defaultSizeIds.length > 0 ? { sizes: defaultSizeIds } : {}),
            availability: 'in_stock',
          })
        }
      } else if (defaultSizeIds.length > 0) {
        // No colors but sizes — one variant covering all sizes
        variants.push({ sizes: defaultSizeIds, availability: 'in_stock' })
      }
      if (variants.length > 0) productData.variants = variants

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
      // Small delay to be kind to Shebiju (avoid triggering their WAF).
      if (i < urlList.length - 1) {
        await new Promise((r) => setTimeout(r, 1500))
      }
    }

    setRunning(false)
  }

  const total = results.length
  const doneCount = results.filter((r) => r.status === 'done').length
  const errorCount = results.filter((r) => r.status === 'error').length
  const finishedCount = doneCount + errorCount
  const overallPct = total > 0 ? Math.round((finishedCount / total) * 100) : 0
  const imageProgress = (r: ImportStatus) => {
    if (r.status === 'scraping') return 10
    if (r.status === 'uploading') {
      const tot = r.imagesTotal || 1
      return 15 + Math.round(((r.imagesDone || 0) / tot) * 70)
    }
    if (r.status === 'creating') return 92
    if (r.status === 'done') return 100
    return 0
  }

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="media-list__btn"
        style={{ fontSize: '11px', letterSpacing: '1px' }}
      >
        IMPORTAR VÁRIOS
      </button>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(2px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
        onClick={(e) => { if (!running && e.target === e.currentTarget) setOpen(false) }}
      >
        <div
          style={{
            background: 'var(--theme-bg, #151517)',
            color: 'var(--theme-text)',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: 8,
            width: '100%',
            maxWidth: 760,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            padding: 22,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Importar vários produtos
            </h2>
            <button
              type="button"
              onClick={() => !running && setOpen(false)}
              disabled={running}
              style={{
                background: 'none',
                border: 'none',
                cursor: running ? 'not-allowed' : 'pointer',
                color: 'var(--theme-elevation-500)',
                fontSize: 20,
                opacity: running ? 0.3 : 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Setup (hidden once import is running or results are shown) */}
          {results.length === 0 && (
            <>
              <p style={{ fontSize: 12, color: 'var(--theme-elevation-400)', margin: 0 }}>
                Cola os URLs da Shebiju (um por linha). Cada produto é importado e salvo automaticamente.
              </p>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder={'https://www.shebiju.pt/pt/produto-1\nhttps://www.shebiju.pt/pt/produto-2'}
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                  style={{ ...inputStyle, width: 'auto', minWidth: 200 }}
                >
                  <option value="">Categoria...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={!categoryId || !urls.trim()}
                  style={{
                    padding: '10px 24px',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: 'var(--theme-text)',
                    color: 'var(--theme-bg)',
                    flex: 1,
                  }}
                >
                  Importar Todos
                </button>
              </div>
            </>
          )}

          {/* Overall progress bar */}
          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
                <span style={{ fontWeight: 600, letterSpacing: 0.5 }}>
                  {running ? 'A importar…' : 'Concluído'}  ·  {finishedCount} / {total}
                  {errorCount > 0 && (
                    <span style={{ color: 'var(--theme-error-500, #ef4444)' }}>
                      {'  '}({errorCount} erro{errorCount === 1 ? '' : 's'})
                    </span>
                  )}
                </span>
                <span style={{ color: 'var(--theme-elevation-500)' }}>{overallPct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--theme-elevation-100)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${overallPct}%`,
                    height: '100%',
                    background: errorCount > 0 && !running
                      ? 'var(--theme-warning-500, #f59e0b)'
                      : 'var(--theme-success-500, #22c55e)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Per-product list */}
          {results.length > 0 && (
            <div
              style={{
                flex: 1,
                minHeight: 240,
                maxHeight: '55vh',
                overflowY: 'auto',
                border: '1px solid var(--theme-elevation-200)',
                borderRadius: 6,
                background: 'var(--theme-elevation-0)',
              }}
            >
              {results.map((r, i) => {
                const rowPct = imageProgress(r)
                const indexLabel = `${String(i + 1).padStart(String(total).length, '0')}/${total}`
                const running = r.status !== 'pending' && r.status !== 'done' && r.status !== 'error'
                return (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--theme-elevation-100)',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: 'var(--theme-elevation-500)',
                          minWidth: String(total).length * 2 + 2 + 'ch',
                          flexShrink: 0,
                        }}
                      >
                        #{indexLabel}
                      </span>
                      {r.status === 'pending' && (
                        <span style={{ color: 'var(--theme-elevation-400)' }}>○</span>
                      )}
                      {running && (
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            border: '2px solid var(--theme-elevation-200)',
                            borderTopColor: 'var(--theme-text)',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {r.status === 'done' && <span style={{ color: 'var(--theme-success-500, #22c55e)' }}>✓</span>}
                      {r.status === 'error' && <span style={{ color: 'var(--theme-error-500, #ef4444)' }}>✗</span>}
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.name || r.url.replace('https://www.shebiju.pt/pt/', '')}
                      </span>
                      <span style={{ color: 'var(--theme-elevation-400)', flexShrink: 0 }}>
                        {r.status === 'scraping' && 'A extrair…'}
                        {r.status === 'uploading' && `Img ${r.imagesDone || 0}/${r.imagesTotal || '?'}`}
                        {r.status === 'creating' && 'A guardar…'}
                        {r.status === 'done' && 'OK'}
                        {r.status === 'error' && (r.error || 'Erro')}
                      </span>
                    </div>
                    {running && (
                      <div
                        style={{
                          marginTop: 6,
                          height: 3,
                          borderRadius: 2,
                          background: 'var(--theme-elevation-100)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${rowPct}%`,
                            height: '100%',
                            background: 'var(--theme-text)',
                            opacity: 0.6,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer actions */}
          {results.length > 0 && !running && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setResults([]); setUrls('') }}
                style={{
                  padding: '10px 18px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: 'var(--theme-text)',
                }}
              >
                Nova importação
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 18px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: 'var(--theme-text)',
                  color: 'var(--theme-bg)',
                }}
              >
                Ver produtos
              </button>
            </div>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </>
  )
}
