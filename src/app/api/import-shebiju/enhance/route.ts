import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

// ── Word fixes & strips applied to AI-generated NAMES (not descriptions) ──
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
  let out = raw
    .replace(/^["'"'`]|["'"'`]$/g, '')
    .replace(/\.$/, '')
    .trim()

  for (const [pattern, replacement] of PT_BR_ES_FIXES) {
    out = out.replace(pattern, replacement)
  }

  out = out
    .replace(/\s+(de|em)?\s*aço\b/gi, '')
    .replace(/\baço\s+/gi, '')

  for (const color of COLOR_WORDS) {
    const escaped = color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out
      .replace(new RegExp(`\\s+(em|de|com|cor)?\\s*${escaped}\\b`, 'gi'), '')
      .replace(new RegExp(`\\b${escaped}\\s+`, 'gi'), '')
  }

  return out
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+(em|de|com|e|a|o)$/i, '')
    .trim()
}

// Apply only the pt-PT fixes to descriptions (keep colors/materials)
function fixPortuguese(raw: string): string {
  let out = raw
  for (const [pattern, replacement] of PT_BR_ES_FIXES) {
    out = out.replace(pattern, replacement)
  }
  return out
}

/**
 * Single Gemini call that returns BOTH an improved product name and
 * a 2-paragraph description based on the product image + base name.
 * Keeps the whole enhance step in one HTTP round-trip so it fits
 * comfortably within Vercel's 10s free-tier limit.
 */
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

    const { name, imageUrl } = await req.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    }
    const baseName = name.trim()

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
      `- Usa SEMPRE português de Portugal (pt-PT). NUNCA espanhol nem português brasileiro. ` +
      `Exemplos: "Prateado" (não "Plateado"), "Dourado" (não "Dorado"), "Prata" (não "Plata").\n` +
      `- Cada parágrafo da descrição com 2-4 frases.\n` +
      `- Estilo elegante, minimalista, sofisticado.\n` +
      `- SEM markdown, SEM títulos, SEM emojis.\n` +
      `- A descrição NÃO deve incluir o nome base, só o melhorado.\n` +
      `- NOME: NÃO uses "aço" nem cores (dourado, prateado, prata, ouro, preto, branco, etc) ` +
      `porque o produto pode ter várias variantes de cor. Usa forma, design, decoração ou acabamento.\n` +
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
      } catch {
        /* text-only fallback */
      }
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
      if (geminiError?.status === 429) {
        return NextResponse.json(
          { error: 'Limite de IA atingido. Aguarda 1 minuto e tenta novamente.', name: baseName, description: null },
          { status: 429 },
        )
      }
      const detail = geminiError ? ` (${geminiError.status}: ${geminiError.message})` : ''
      return NextResponse.json(
        { error: `Serviço de IA indisponível${detail}`, name: baseName, description: null },
        { status: 502 },
      )
    }

    // Parse response: NOME: ... / DESCRIÇÃO: ...
    let improvedName = baseName
    let descriptionParagraphs: string[] = []

    const nomeMatch = aiText.match(/NOME\s*:\s*([\s\S]+?)(?=\n\s*DESCRIÇÃO\s*:|\n\s*DESCRICAO\s*:|$)/i)
    if (nomeMatch) {
      improvedName = postProcessName(nomeMatch[1].split('\n')[0])
    }

    const descMatch = aiText.match(/DESCRI(?:Ç|C)[ÃA]O\s*:\s*([\s\S]+)$/i)
    if (descMatch) {
      descriptionParagraphs = descMatch[1]
        .split(/\n\s*\n/)
        .map((p) => fixPortuguese(p.trim().replace(/^["'"']|["'"']$/g, '').trim()))
        .filter(Boolean)
        .slice(0, 3)
    }

    // Build Lexical JSON if we got any description paragraphs
    let descriptionLexical: any = null
    if (descriptionParagraphs.length > 0) {
      const nameForBold = improvedName
      const lexicalChildren = descriptionParagraphs.map((para, idx) => {
        if (idx === 0 && nameForBold) {
          const boldIdx = para.indexOf(nameForBold)
          if (boldIdx >= 0) {
            const before = para.slice(0, boldIdx)
            const after = para.slice(boldIdx + nameForBold.length)
            const children: any[] = []
            if (before) children.push({ type: 'text', text: before, version: 1 })
            children.push({ type: 'text', text: nameForBold, format: 1, version: 1 })
            if (after) children.push({ type: 'text', text: after, version: 1 })
            return {
              type: 'paragraph',
              children,
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            }
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
      descriptionLexical = {
        root: {
          type: 'root',
          children: lexicalChildren,
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      }
    }

    if (improvedName.length > 100) improvedName = improvedName.slice(0, 100)

    return NextResponse.json({
      success: true,
      name: improvedName,
      description: descriptionLexical,
      descriptionText: descriptionParagraphs.join('\n\n'),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}
