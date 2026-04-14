'use client'
import React, { useState, useRef } from 'react'

type LogLine = { type: 'info' | 'ok' | 'err' | 'skip'; text: string }

export const RegenerateNamesButton: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [startSlug, setStartSlug] = useState('GMN2512046')
  const [dryRun, setDryRun] = useState(true)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const stopRef = useRef(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  const append = (line: LogLine) => {
    setLog((l) => {
      const next = [...l, line]
      setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
      return next
    })
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const run = async () => {
    setRunning(true)
    stopRef.current = false
    setLog([])
    setProgress({ done: 0, total: 0 })

    append({ type: 'info', text: `A procurar produto inicial ${startSlug}…` })
    try {
      const startRes = await fetch(
        `/api/products?where[slug][equals]=${encodeURIComponent(startSlug)}&limit=1&depth=0`,
        { credentials: 'include' },
      )
      const startData = await startRes.json()
      const startDoc = startData?.docs?.[0]
      if (!startDoc) {
        append({ type: 'err', text: `Produto ${startSlug} não encontrado.` })
        setRunning(false)
        return
      }
      const startCreatedAt = startDoc.createdAt
      append({ type: 'info', text: `Encontrado. Criado em ${startCreatedAt}` })

      // Fetch ALL products created >= startCreatedAt (paginate because API default is 10)
      const allDocs: any[] = []
      let page = 1
      while (true) {
        const listRes = await fetch(
          `/api/products?where[createdAt][greater_than_equal]=${encodeURIComponent(startCreatedAt)}&sort=createdAt&limit=100&page=${page}&depth=1`,
          { credentials: 'include' },
        )
        const listData = await listRes.json()
        const docs = listData?.docs || []
        allDocs.push(...docs)
        if (!listData?.hasNextPage) break
        page += 1
        if (page > 20) break
      }

      setProgress({ done: 0, total: allDocs.length })
      append({ type: 'info', text: `${allDocs.length} produtos a processar. dryRun=${dryRun}. ~13s por produto.` })

      for (let i = 0; i < allDocs.length; i++) {
        if (stopRef.current) {
          append({ type: 'info', text: 'Parado pelo utilizador.' })
          break
        }
        const p = allDocs[i]
        append({ type: 'info', text: `[${i + 1}/${allDocs.length}] ${p.slug} — "${p.name}"` })
        try {
          const res = await fetch('/api/admin-tools/regenerate-one', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: p.id, dryRun }),
          })
          const data = await res.json()
          if (!res.ok) {
            append({ type: 'err', text: `  ✗ ${data.error || res.status}` })
            if (data.retryable) {
              append({ type: 'info', text: '  A aguardar 60s por rate-limit…' })
              await sleep(60_000)
            }
          } else {
            append({ type: 'ok', text: `  ✓ → "${data.newName}"` })
          }
        } catch (e: any) {
          append({ type: 'err', text: `  ✗ ${e?.message || 'Erro rede'}` })
        }
        setProgress({ done: i + 1, total: allDocs.length })
        if (i < allDocs.length - 1 && !stopRef.current) await sleep(13_000)
      }

      append({ type: 'info', text: 'Terminado.' })
    } catch (e: any) {
      append({ type: 'err', text: `Erro geral: ${e?.message}` })
    } finally {
      setRunning(false)
    }
  }

  const stop = () => {
    stopRef.current = true
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="media-list__btn"
        title="Regenerar nome e descrição com IA em lote"
      >
        REGENERAR IA
      </button>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="media-list__btn">
        REGENERAR IA
      </button>
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
      >
        <div
          style={{
            background: 'var(--theme-bg, #151517)', color: 'var(--theme-text, #e5e5e5)',
            borderRadius: 8, padding: 20, width: '100%', maxWidth: 720, maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--theme-elevation-200)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Regenerar nome + descrição (IA em lote)</h2>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13 }}>
              Slug inicial:{' '}
              <input
                type="text"
                value={startSlug}
                onChange={(e) => setStartSlug(e.target.value)}
                disabled={running}
                style={{
                  padding: '4px 8px', border: '1px solid var(--theme-elevation-200)',
                  borderRadius: 4, background: 'var(--theme-input-bg, #151517)',
                  color: 'var(--theme-text)', fontSize: 13,
                }}
              />
            </label>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={running}
              />
              Dry-run (não gravar)
            </label>
            {progress.total > 0 && (
              <span style={{ fontSize: 13, marginLeft: 'auto' }}>
                {progress.done} / {progress.total}
              </span>
            )}
          </div>

          <div
            style={{
              flex: 1, minHeight: 300, maxHeight: '60vh', overflow: 'auto',
              background: '#0a0a0a', border: '1px solid var(--theme-elevation-200)',
              borderRadius: 4, padding: 10, fontFamily: 'monospace', fontSize: 12,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}
          >
            {log.length === 0 && <span style={{ opacity: 0.5 }}>(log aparece aqui)</span>}
            {log.map((l, i) => (
              <div
                key={i}
                style={{
                  color:
                    l.type === 'err' ? '#ff6b6b' :
                    l.type === 'ok' ? '#51cf66' :
                    l.type === 'skip' ? '#ffd43b' : '#aaa',
                }}
              >
                {l.text}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            {!running ? (
              <>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="media-list__btn"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={run}
                  className="media-list__btn media-list__btn--filled"
                >
                  {dryRun ? 'Começar (dry-run)' : 'Começar (gravar)'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={stop}
                className="media-list__btn media-list__btn--danger"
              >
                Parar
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
