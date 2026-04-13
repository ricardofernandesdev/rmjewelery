'use client'
import React, { useState, useEffect } from 'react'
import { useField, useForm } from '@payloadcms/ui'

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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<string | null>(null)

  // Pending image URLs (not yet uploaded to Media)
  const [pendingImages, setPendingImages] = useState<string[]>([])

  const nameField = useField<string>({ path: 'name' })
  const slugField = useField<string>({ path: 'slug' })
  const priceField = useField<number>({ path: 'price' })
  const imagesField = useField<number[]>({ path: 'images' })
  const categoryField = useField<number>({ path: 'category' })
  const enableColorsField = useField<boolean>({ path: 'enableColors' })
  const { submit } = useForm()

  useEffect(() => {
    fetch('/api/categories?limit=100&depth=0&sort=name', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.docs) setCategories(data.docs.map((d: any) => ({ id: d.id, name: d.name })))
      })
      .catch(() => {})
  }, [])

  // ── Step 1: Scrape only (no image uploads) ──
  const handleImport = async () => {
    if (!url.trim()) return
    if (!categoryId) {
      setError('Seleciona uma categoria antes de importar.')
      return
    }
    setLoading(true)
    setError(null)
    setPendingImages([])

    try {
      setStep('A extrair dados do produto...')
      const scrapeRes = await fetch('/api/import-shebiju/scrape', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const scrapeData = await scrapeRes.json()
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Erro ao extrair dados')
      const result = scrapeData as ScrapeResult

      // Fill form fields (no images yet)
      nameField.setValue(result.name || result.ref || '')
      slugField.setValue(result.ref || '')
      priceField.setValue(result.price || 0)
      categoryField.setValue(categoryId)
      if (result.colors.length > 0) enableColorsField.setValue(true)

      // Store image URLs for later upload
      setPendingImages(result.imageUrls)

      setStep(
        `Dados extraídos: "${result.name || result.ref}" — ${result.imageUrls.length} imagens prontas. Revê o formulário e clica "Guardar Produto".`,
      )
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido')
      setLoading(false)
      setStep(null)
    }
  }

  // ── Step 2: Upload images + submit form ──
  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const mediaIds: number[] = []

      for (let i = 0; i < pendingImages.length; i++) {
        setStep(`A carregar imagem ${i + 1} de ${pendingImages.length}...`)
        try {
          const uploadRes = await fetch('/api/import-shebiju/upload-image', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: pendingImages[i],
              altText: slugField.value || nameField.value || 'img',
              index: i + 1,
            }),
          })
          const uploadData = await uploadRes.json()
          if (uploadRes.ok && uploadData.mediaId) {
            mediaIds.push(uploadData.mediaId)
          }
        } catch {
          // Skip failed
        }
      }

      if (mediaIds.length === 0) {
        throw new Error('Nenhuma imagem foi carregada.')
      }

      imagesField.setValue(mediaIds)

      setStep('A guardar produto...')
      // Small delay for Payload form state to update before submit
      await new Promise((r) => setTimeout(r, 300))
      await submit()
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar')
      setSaving(false)
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
        Cola o URL, seleciona a categoria. O formulário é preenchido sem guardar. Revê os dados e
        clica "Guardar Produto" quando estiveres satisfeito.
      </p>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.shebiju.pt/pt/..."
          disabled={loading || saving}
          style={{ ...inputStyle, flex: '1 1 250px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading && !saving) handleImport()
          }}
        />
        <select
          value={categoryId || ''}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
          disabled={loading || saving}
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
          disabled={loading || saving || !url.trim()}
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
              <Spinner /> A extrair...
            </span>
          ) : (
            'Importar'
          )}
        </button>
      </div>

      {/* Image previews from source URLs (not yet uploaded) */}
      {pendingImages.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', marginBottom: '8px' }}>
            {pendingImages.length} imagens prontas (serão carregadas ao guardar):
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {pendingImages.map((imgUrl, i) => (
              <img
                key={i}
                src={imgUrl}
                alt={`Preview ${i + 1}`}
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid var(--theme-elevation-200)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Save button — only shows after import */}
      {pendingImages.length > 0 && !saving && (
        <button
          type="button"
          onClick={handleSave}
          style={{
            marginTop: '14px',
            padding: '12px 28px',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            background: 'var(--theme-success-500, #22c55e)',
            color: 'white',
            transition: 'opacity 0.15s',
            width: '100%',
          }}
        >
          Guardar Produto
        </button>
      )}

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

const Spinner: React.FC = () => (
  <span
    style={{
      width: '14px',
      height: '14px',
      border: '2px solid var(--theme-elevation-300)',
      borderTopColor: 'var(--theme-elevation-500)',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
      display: 'inline-block',
    }}
  />
)
