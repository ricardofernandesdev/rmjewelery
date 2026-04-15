'use client'
import React, { useState, useEffect } from 'react'
import { useField } from '@payloadcms/ui'

type ScrapeResult = {
  name: string
  ref: string
  imageUrls: string[]
  colors: string[]
  price: number
  description: any | null
}

type Category = { id: number; name: string }

const descTemplates: Record<string, [string, string]> = {
  brincos: [
    'Os {name} foram concebidos para realçar o rosto com suavidade e brilho, ideais para quem procura acessórios discretos, mas cheios de charme. O seu design moderno acrescenta equilíbrio e luminosidade ao visual, tornando-os perfeitos para todas as ocasiões.',
    'Seja para o dia a dia ou para complementar um look especial, estes brincos conferem um toque de elegância intuitiva que não passa despercebida — um verdadeiro clássico contemporâneo.',
  ],
  colares: [
    'O {name} foi desenhado para adornar o pescoço com delicadeza e sofisticação, ideal para quem valoriza peças que combinam elegância e versatilidade. O seu design cuidado realça qualquer decote, acrescentando um toque de luminosidade ao visual.',
    'Perfeito tanto para ocasiões especiais como para o uso diário, este colar é a escolha ideal para quem procura um acessório que se destaca pela sua simplicidade refinada — uma peça intemporal que complementa qualquer estilo.',
  ],
  pulseiras: [
    'A {name} foi criada para envolver o pulso com elegância e subtileza, perfeita para quem procura um acessório que alia design moderno a um conforto excepcional. O seu acabamento cuidado reflete a luz de forma delicada, acrescentando um brilho discreto ao visual.',
    'Seja usada sozinha ou combinada com outras peças, esta pulseira adapta-se a qualquer ocasião — do dia a dia aos momentos mais especiais. Um acessório versátil que se torna rapidamente indispensável.',
  ],
  aneis: [
    'O {name} foi concebido para adornar os dedos com elegância e personalidade, ideal para quem procura peças que se destacam pela sua beleza discreta. O seu design harmonioso combina modernidade e atemporalidade, tornando-o perfeito para qualquer ocasião.',
    'Seja para uso diário ou para complementar um look mais elaborado, este anel confere um toque de sofisticação que não passa despercebido — uma peça que se torna parte da sua identidade.',
  ],
}

function detectCat(name: string, catName: string): string | null {
  const text = `${name} ${catName}`.toLowerCase()
  if (text.includes('brinco')) return 'brincos'
  if (text.includes('colar')) return 'colares'
  if (text.includes('pulseira')) return 'pulseiras'
  if (text.includes('anel') || text.includes('anéis')) return 'aneis'
  return null
}

function buildLexicalDescription(productName: string, cat: string) {
  const [p1Raw, p2Raw] = descTemplates[cat]
  const p1 = p1Raw.replace('{name}', productName)
  const p2 = p2Raw.replace('{name}', productName)
  const idx = p1.indexOf(productName)
  const children =
    idx >= 0
      ? [
          ...(idx > 0 ? [{ type: 'text', text: p1.slice(0, idx), version: 1 }] : []),
          { type: 'text', text: productName, format: 1, version: 1 },
          ...(idx + productName.length < p1.length
            ? [{ type: 'text', text: p1.slice(idx + productName.length), version: 1 }]
            : []),
        ]
      : [{ type: 'text', text: p1, version: 1 }]
  return {
    root: {
      type: 'root',
      children: [
        { type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, version: 1 },
        { type: 'paragraph', children: [{ type: 'text', text: p2, version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 },
      ],
      direction: 'ltr', format: '', indent: 0, version: 1,
    },
  }
}

export const ShebijuImport: React.FC = () => {
  const [url, setUrl] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const nameField = useField<string>({ path: 'name' })
  const slugField = useField<string>({ path: 'slug' })
  const priceField = useField<number>({ path: 'price' })
  const imagesField = useField<number[]>({ path: 'images' })
  const categoryField = useField<number>({ path: 'category' })
  const [descPreview, setDescPreview] = useState<string | null>(null)
  const enableColorsField = useField<boolean>({ path: 'enableColors' })
  const enableSizesField = useField<boolean>({ path: 'enableSizes' })
  const colorsField = useField<number[]>({ path: 'colors' })
  const sizesField = useField<number[]>({ path: 'sizes' })
  const variantsField = useField<any[]>({ path: 'variants' })

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
    setDone(false)

    try {
      // ── Step 1: Scrape ──
      setStep('1/2 — A extrair dados do produto...')
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
          } else {
            console.warn(`Image ${i + 1} failed:`, uploadData.error || uploadRes.status)
          }
        } catch (imgErr: any) {
          console.warn(`Image ${i + 1} error:`, imgErr.message)
        }
      }

      // No AI enhancement — use the raw Shebiju name. The server-side
      // hook still fills the description with the category template.
      const finalName = result.name || result.ref || ''
      const productName = finalName
      nameField.setValue(productName)
      slugField.setValue(result.ref || '')
      priceField.setValue(result.price || 0)
      categoryField.setValue(categoryId)
      if (mediaIds.length > 0) imagesField.setValue(mediaIds)

      // Pre-select autoSelect colors + sizes from the global libraries and
      // generate one variant per (color × size) combination — falling back
      // to a single axis when only one is configured.
      try {
        const [colorsRes, sizesRes] = await Promise.all([
          fetch('/api/colors?where[autoSelect][equals]=true&limit=100&depth=0&sort=name', {
            credentials: 'include',
          }),
          fetch('/api/sizes?where[autoSelect][equals]=true&limit=100&depth=0&sort=name', {
            credentials: 'include',
          }),
        ])
        const colorsData = await colorsRes.json()
        const sizesData = await sizesRes.json()

        const defaultColorIds: number[] = (colorsData?.docs || []).map(
          (d: any) => d.id as number,
        )
        const defaultSizeIds: number[] = (sizesData?.docs || []).map(
          (d: any) => d.id as number,
        )

        if (defaultColorIds.length > 0) {
          enableColorsField.setValue(true)
          colorsField.setValue(defaultColorIds)
        }
        if (defaultSizeIds.length > 0) {
          enableSizesField.setValue(true)
          sizesField.setValue(defaultSizeIds)
        }

        // One variant per color, each spanning all auto-select sizes.
        const variants: any[] = []
        if (defaultColorIds.length > 0) {
          for (const c of defaultColorIds) {
            variants.push({
              color: String(c),
              sizes: defaultSizeIds.length > 0 ? defaultSizeIds : [],
              price: null,
              availability: 'in_stock',
            })
          }
        } else if (defaultSizeIds.length > 0) {
          variants.push({
            color: '',
            sizes: defaultSizeIds,
            price: null,
            availability: 'in_stock',
          })
        }
        if (variants.length > 0) variantsField.setValue(variants)
      } catch {
        // Skip if either fetch fails
      }
      // Show description preview from the category template
      const selectedCat = categories.find((c) => c.id === categoryId)
      const catKey = detectCat(productName, selectedCat?.name || '')
      if (catKey && descTemplates[catKey]) {
        const [p1, p2] = descTemplates[catKey]
        setDescPreview(
          p1.replace('{name}', productName) + '\n\n' + p2.replace('{name}', productName),
        )
      }

      setDone(true)
      setStep(
        `Formulário preenchido: "${result.name || result.ref}" — ${mediaIds.length} imagens. Clica "Salvar" para guardar.`,
      )
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido')
      setLoading(false)
      setStep(null)
    }
  }

  if (done) {
    return (
      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          border: '1px solid var(--theme-success-500, #22c55e)',
          borderRadius: '8px',
          background: 'var(--theme-elevation-0)',
        }}
      >
        <p style={{ fontSize: '13px', color: 'var(--theme-success-500, #22c55e)', marginBottom: descPreview ? '12px' : 0 }}>
          {step}
        </p>
        {descPreview && (
          <div
            style={{
              padding: '12px',
              background: 'var(--theme-elevation-50)',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-150)',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--theme-elevation-500)', marginBottom: '8px' }}>
              Descrição (gerada ao salvar)
            </p>
            <p style={{ fontSize: '13px', color: 'var(--theme-text)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {descPreview}
            </p>
          </div>
        )}
      </div>
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
        Cola o URL, seleciona a categoria. O formulário é preenchido automaticamente. Depois clica "Salvar".
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
                  display: 'inline-block',
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
