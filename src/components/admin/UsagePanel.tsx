'use client'
import React, { useEffect, useState, useCallback } from 'react'

type Usage = {
  generatedAt: string
  r2: {
    objects: number
    bytes: number
    storageLimitBytes: number
    error: string | null
  }
  db: {
    products: number
    media: number
    categories: number
    colors: number
    sizes: number
    users: number
    productsByCategory: Array<{ category: string; count: number }>
  }
  links: { vercelUsage: string; cloudflareAnalytics: string }
}

const fmtBytes = (n: number): string => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export const UsagePanel: React.FC = () => {
  const [data, setData] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/admin/usage', { credentials: 'include' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const j = await r.json()
      setData(j)
    } catch (e: any) {
      setError(e?.message || 'Falha a obter dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const r2Pct = data ? (data.r2.bytes / data.r2.storageLimitBytes) * 100 : 0
  const r2Remaining = data
    ? fmtBytes(Math.max(0, data.r2.storageLimitBytes - data.r2.bytes))
    : '—'

  const card: React.CSSProperties = {
    background: 'var(--theme-elevation-0)',
    border: '1px solid var(--theme-elevation-200)',
    borderRadius: 8,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }
  const kpiLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'var(--theme-elevation-500)',
  }
  const kpiValue: React.CSSProperties = {
    fontSize: 26,
    fontWeight: 600,
    color: 'var(--theme-text)',
  }
  const kpiHint: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--theme-elevation-400)',
  }

  return (
    <div style={{ maxWidth: 1400, padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: 0.5 }}>
          Uso de recursos
        </h1>
        <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
          {data ? `atualizado ${new Date(data.generatedAt).toLocaleString('pt-PT')}` : ''}
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--theme-elevation-500)', margin: '0 0 20px' }}>
        Uma vista rápida do storage e da base de dados. Bandwidth e operações detalhadas continuam nos dashboards oficiais (links em baixo).
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{
            padding: '9px 18px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'wait' : 'pointer',
            background: 'var(--theme-text)',
            color: 'var(--theme-bg)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {loading && (
            <span
              style={{
                width: 12,
                height: 12,
                border: '2px solid transparent',
                borderTopColor: 'currentColor',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }}
            />
          )}
          {loading ? 'A atualizar…' : '↻ Atualizar'}
        </button>
      </div>

      {error && (
        <div style={{
          ...card,
          borderColor: 'var(--theme-error-500, #ef4444)',
          color: 'var(--theme-error-500, #ef4444)',
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {data && (
        <>
          {/* KPI row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={card}>
              <span style={kpiLabel}>Produtos</span>
              <span style={kpiValue}>{data.db.products.toLocaleString('pt-PT')}</span>
            </div>
            <div style={card}>
              <span style={kpiLabel}>Imagens (media)</span>
              <span style={kpiValue}>{data.db.media.toLocaleString('pt-PT')}</span>
            </div>
            <div style={card}>
              <span style={kpiLabel}>Categorias</span>
              <span style={kpiValue}>{data.db.categories.toLocaleString('pt-PT')}</span>
            </div>
            <div style={card}>
              <span style={kpiLabel}>Users</span>
              <span style={kpiValue}>{data.db.users.toLocaleString('pt-PT')}</span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)',
              gap: 16,
              marginBottom: 16,
            }}
          >
            {/* R2 card */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={kpiLabel}>Cloudflare R2 · Storage</span>
                <span style={kpiHint}>{data.r2.objects.toLocaleString('pt-PT')} objectos</span>
              </div>
              {data.r2.error ? (
                <p style={{ color: 'var(--theme-error-500, #ef4444)', fontSize: 13, margin: 0 }}>
                  {data.r2.error}
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={kpiValue}>{fmtBytes(data.r2.bytes)}</span>
                    <span style={kpiHint}>/ {fmtBytes(data.r2.storageLimitBytes)}</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: 'var(--theme-elevation-100)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, r2Pct)}%`,
                        height: '100%',
                        background:
                          r2Pct > 90
                            ? 'var(--theme-error-500, #ef4444)'
                            : r2Pct > 70
                              ? 'var(--theme-warning-500, #f59e0b)'
                              : 'var(--theme-success-500, #22c55e)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={kpiHint}>
                    {r2Pct.toFixed(1)}% usado · {r2Remaining} livres no free tier
                  </span>
                </>
              )}
            </div>

            {/* Biblioteca */}
            <div style={card}>
              <span style={kpiLabel}>Biblioteca</span>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={kpiValue}>{data.db.colors}</div>
                  <div style={kpiHint}>cores</div>
                </div>
                <div>
                  <div style={kpiValue}>{data.db.sizes}</div>
                  <div style={kpiHint}>tamanhos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Produtos por categoria */}
          {data.db.productsByCategory.length > 0 && (
            <div style={{ ...card, marginBottom: 16 }}>
              <span style={kpiLabel}>Produtos por categoria</span>
              {(() => {
                const max = Math.max(...data.db.productsByCategory.map((c) => c.count), 1)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                    {data.db.productsByCategory.map((c) => (
                      <div key={c.category}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span>{c.category}</span>
                          <span style={{ color: 'var(--theme-elevation-500)' }}>{c.count}</span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 4,
                            background: 'var(--theme-elevation-100)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${(c.count / max) * 100}%`,
                              height: '100%',
                              background: 'var(--theme-text)',
                              opacity: 0.75,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Links externos */}
          <div style={card}>
            <span style={kpiLabel}>Dashboards oficiais</span>
            <p style={{ ...kpiHint, margin: 0 }}>
              Para ver bandwidth, invocações de funções ou operações de R2 detalhadas:
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a
                href={data.links.vercelUsage}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: 4,
                  color: 'var(--theme-text)',
                  textDecoration: 'none',
                }}
              >
                Vercel Usage ↗
              </a>
              <a
                href={data.links.cloudflareAnalytics}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: 4,
                  color: 'var(--theme-text)',
                  textDecoration: 'none',
                }}
              >
                Cloudflare R2 Metrics ↗
              </a>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
