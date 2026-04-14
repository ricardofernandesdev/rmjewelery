import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

const PT_BR_ES_FIXES: Array<[RegExp, string]> = [
  [/\bplateado\b/gi, 'Prateado'],
  [/\bplateada\b/gi, 'Prateada'],
  [/\bdorado\b/gi, 'Dourado'],
  [/\bdorada\b/gi, 'Dourada'],
  [/\bplata\b/gi, 'Prata'],
  [/\boro\b/gi, 'Ouro'],
]

const COLOR_WORDS = [
  'dourado', 'dourada', 'dourados', 'douradas',
  'prateado', 'prateada', 'prateados', 'prateadas',
  'prata', 'ouro',
  'rose gold', 'rosegold',
  'preto', 'preta', 'pretos', 'pretas',
  'branco', 'branca', 'brancos', 'brancas',
  'azul', 'azuis', 'verde', 'verdes', 'vermelho', 'vermelha',
  'cobre', 'bronze',
]

function postProcessName(raw: string): string {
  let out = raw.replace(/^["'"'`]|["'"'`]$/g, '').replace(/\.$/, '').trim()
  for (const [pattern, replacement] of PT_BR_ES_FIXES) out = out.replace(pattern, replacement)
  out = out.replace(/\s+(de|em)?\s*aço\b/gi, '').replace(/\baço\s+/gi, '')
  for (const color of COLOR_WORDS) {
    const escaped = color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out
      .replace(new RegExp(`\\s+(em|de|com|cor)?\\s*${escaped}\\b`, 'gi'), '')
      .replace(new RegExp(`\\b${escaped}\\s+`, 'gi'), '')
  }
  return out.replace(/\s{2,}/g, ' ').replace(/\s+(em|de|com|e|a|o)$/i, '').trim()
}

function fixPortuguese(raw: string): string {
  let out = raw
  for (const [pattern, replacement] of PT_BR_ES_FIXES) out = out.replace(pattern, replacement)
  return out
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada.' }, { status: 500 })
    }

    const { id, dryRun } = await req.json()
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const product: any = await payload.findByID({ collection: 'products', id, depth: 1 })
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    const baseName = (product.name || '').trim() || 'Produto'
    const firstImage = Array.isArray(product.images) && product.images[0]
    const imageUrl =
      typeof firstImage === 'object'
        ? firstImage?.url || firstImage?.sizes?.large?.url || ''
        : ''

    const prompt =
      `És um copywriter de uma marca de joalharia portuguesa minimalista e sofisticada.\n\n` +
      `Nome base do produto: "${baseName}".\n` +
      (imageUrl
        ? `Olha atentamente para a imagem da peça e identifica detalhes visuais (material, ` +
          `formato, pérolas, zircónias, acabamento, decoração).\n\n`
        : '\n') +
      `Devolve a tua resposta EXACTAMENTE neste formato (sem mais nada):\n\n` +
      `NOME: <nome melhorado do produto, max 8 palavras, sem aspas, sem pontuação final, descritivo e único>\n\n` +
      `DESCRIÇÃO:\n<parágrafo 1: começa com o nome melhorado e descreve a peça>\n\n<parágrafo 2: fala sobre ocasiões de uso e o estilo/sensação que transmite>\n\n` +
      `Regras:\n` +
      `- Usa SEMPRE português de Portugal (pt-PT). NUNCA espanhol nem português brasileiro.\n` +
      `- Cada parágrafo da descrição com 2-4 frases.\n` +
      `- Estilo elegante, minimalista, sofisticado.\n` +
      `- SEM markdown, SEM títulos, SEM emojis.\n` +
      `- A descrição NÃO deve incluir o nome base, só o melhorado.\n` +
      `- NOME: NÃO uses "aço" nem cores (dourado, prateado, prata, ouro, preto, etc).\n` +
      `- DESCRIÇÃO: pode mencionar materiais e cores se forem visíveis na imagem.`

    const parts: any[] = [{ text: prompt }]
    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(4000) })
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer())
          const mimeType = (imgRes.headers.get('content-type') || 'image/jpeg').split(';')[0].trim()
          parts.push({ inline_data: { mime_type: mimeType, data: buffer.toString('base64') } })
        }
      } catch { /* text-only fallback */ }
    }

    const BUDGET_MS = 7000
    const withTimeout = <T,>(p: Promise<T>): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), BUDGET_MS)),
      ])

    let aiText = ''
    let geminiError: { status: number; message: string } | null = null
    try {
      const res = await withTimeout(
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 500,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
          },
        ),
      )
      if (res.ok) {
        const data = await withTimeout(res.json())
        aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
      } else {
        let body: any
        try { body = await res.json() } catch { body = await res.text() }
        const message =
          (typeof body === 'object' && body?.error?.message) ||
          (typeof body === 'string' ? body.slice(0, 200) : `HTTP ${res.status}`)
        geminiError = { status: res.status, message }
      }
    } catch (e: any) {
      geminiError = { status: 0, message: e?.message === 'timeout' ? 'Timeout (>7s)' : e?.message || 'Erro' }
    }

    if (!aiText) {
      const status = geminiError?.status === 429 ? 429 : 502
      const detail = geminiError ? ` (${geminiError.status}: ${geminiError.message})` : ''
      return NextResponse.json(
        { error: `Serviço de IA indisponível${detail}`, retryable: status === 429 },
        { status },
      )
    }

    let improvedName = baseName
    let descriptionParagraphs: string[] = []

    const nomeMatch = aiText.match(/NOME\s*:\s*([\s\S]+?)(?=\n\s*DESCRIÇÃO\s*:|\n\s*DESCRICAO\s*:|$)/i)
    if (nomeMatch) improvedName = postProcessName(nomeMatch[1].split('\n')[0])

    const descMatch = aiText.match(/DESCRI(?:Ç|C)[ÃA]O\s*:\s*([\s\S]+)$/i)
    if (descMatch) {
      descriptionParagraphs = descMatch[1]
        .split(/\n\s*\n/)
        .map((p) => fixPortuguese(p.trim().replace(/^["'"']|["'"']$/g, '').trim()))
        .filter(Boolean)
        .slice(0, 3)
    }

    if (improvedName.length > 100) improvedName = improvedName.slice(0, 100)
    if (!improvedName || descriptionParagraphs.length === 0) {
      return NextResponse.json({ error: 'Resposta AI incompleta', retryable: false }, { status: 502 })
    }

    // Build Lexical JSON
    const lexicalChildren = descriptionParagraphs.map((para, idx) => {
      if (idx === 0 && improvedName) {
        const boldIdx = para.indexOf(improvedName)
        if (boldIdx >= 0) {
          const before = para.slice(0, boldIdx)
          const after = para.slice(boldIdx + improvedName.length)
          const children: any[] = []
          if (before) children.push({ type: 'text', text: before, version: 1 })
          children.push({ type: 'text', text: improvedName, format: 1, version: 1 })
          if (after) children.push({ type: 'text', text: after, version: 1 })
          return { type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, version: 1 }
        }
      }
      return {
        type: 'paragraph',
        children: [{ type: 'text', text: para, version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      }
    })
    const descriptionLexical = {
      root: {
        type: 'root',
        children: lexicalChildren,
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }

    if (!dryRun) {
      await payload.update({
        collection: 'products',
        id,
        data: { name: improvedName, description: descriptionLexical as any },
      })
    }

    return NextResponse.json({
      success: true,
      dryRun: !!dryRun,
      id,
      oldName: product.name,
      newName: improvedName,
      descriptionPreview: descriptionParagraphs.join('\n\n'),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}
