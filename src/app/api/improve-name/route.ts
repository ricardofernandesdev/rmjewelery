import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

// ── Word fixes & strips applied to AI-generated names ──
const PT_BR_ES_FIXES: Array<[RegExp, string]> = [
  [/\bplateado\b/gi, 'Prateado'],
  [/\bplateada\b/gi, 'Prateada'],
  [/\bdorado\b/gi, 'Dourado'],
  [/\bdorada\b/gi, 'Dourada'],
  [/\bplata\b/gi, 'Prata'],
  [/\boro\b/gi, 'Ouro'],
]

// Colors that should NEVER appear in a product name (variants vary)
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

  // Apply European Portuguese fixes
  for (const [pattern, replacement] of PT_BR_ES_FIXES) {
    out = out.replace(pattern, replacement)
  }

  // Strip "aço" mentions
  out = out
    .replace(/\s+(de|em)?\s*aço\b/gi, '')
    .replace(/\baço\s+/gi, '')

  // Strip color words (with optional "em"/"de" before)
  for (const color of COLOR_WORDS) {
    const escaped = color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out
      .replace(new RegExp(`\\s+(em|de|com|cor)?\\s*${escaped}\\b`, 'gi'), '')
      .replace(new RegExp(`\\b${escaped}\\s+`, 'gi'), '')
  }

  // Collapse whitespace and trim trailing connectors
  return out
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+(em|de|com|e|com|a|o)$/i, '')
    .trim()
}

/**
 * Generate a descriptive product name using Google Gemini 2.0 Flash.
 * When an image URL is provided, fetches the image and includes it in
 * the prompt so the model can describe what it sees (material, shape,
 * details) and produce a unique name per product.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada no servidor.' },
        { status: 500 },
      )
    }

    const { name, imageUrl } = await req.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    }

    const prompt =
      `Cria um nome de produto descritivo e único em PORTUGUÊS DE PORTUGAL (pt-PT) para esta peça de joalharia. ` +
      `Nome base: "${name.trim()}". ` +
      (imageUrl
        ? `Olha atentamente para a imagem e descreve no nome os detalhes visuais específicos ` +
          `(formato, pérolas, zircónias, decoração, acabamento). `
        : '') +
      `REGRAS ABSOLUTAS:\n` +
      `1. USA APENAS português europeu (Portugal). NUNCA espanhol nem português brasileiro. ` +
      `Exemplos corretos: "Prateado" (não "Plateado"), "Dourado" (não "Dorado"), "Prata" (não "Plata"), "Ouro" (não "Oro").\n` +
      `2. NÃO uses a palavra "aço" nem "Aço".\n` +
      `3. NÃO menciones cores no nome (proibido: dourado, prateado, prata, ouro, rose gold, preto, branco, azul, etc). ` +
      `O produto pode ter várias variantes de cor, por isso o nome deve ser neutro quanto à cor.\n` +
      `Devolve APENAS o nome melhorado (máximo 8 palavras), sem aspas, sem pontuação final, ` +
      `sem explicações, sem quebras de linha. ` +
      `Estilo sofisticado e minimalista. Exemplos: ` +
      `"Pulseira Entrelaçada Minimalista", "Anel com Pérola Central", ` +
      `"Brincos Forma Geométrica".`

    // Build Gemini request parts
    const parts: any[] = [{ text: prompt }]

    // Fetch and embed image if provided
    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(4000) })
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer())
          const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'
          parts.push({
            inline_data: {
              mime_type: mimeType.split(';')[0].trim(),
              data: buffer.toString('base64'),
            },
          })
        }
      } catch {
        // Image fetch failed — proceed with text-only
      }
    }

    // Hard 7s ceiling via Promise.race — Gemini is typically <2s but we
    // want to return gracefully if something is slow today.
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
                temperature: 0.8,
                maxOutputTokens: 50,
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
        try {
          body = await res.json()
        } catch {
          body = await res.text()
        }
        const message =
          (typeof body === 'object' && body?.error?.message) ||
          (typeof body === 'string' ? body.slice(0, 200) : `HTTP ${res.status}`)
        geminiError = { status: res.status, message }
        console.error('Gemini error:', res.status, message)
      }
    } catch (e: any) {
      geminiError = { status: 0, message: e?.message === 'timeout' ? 'Timeout (>7s)' : (e?.message || 'Network error') }
    }

    if (!aiText) {
      // Surface a friendlier message for the common rate-limit case
      if (geminiError?.status === 429) {
        return NextResponse.json(
          { error: 'Limite de IA atingido. Aguarda 1 minuto e tenta novamente.' },
          { status: 429 },
        )
      }
      const detail = geminiError ? ` (${geminiError.status}: ${geminiError.message})` : ''
      return NextResponse.json(
        { error: `Serviço de IA indisponível${detail}` },
        { status: 502 },
      )
    }

    // Clean response
    if (aiText.includes('\n')) aiText = aiText.split('\n')[0].trim()
    if (aiText.length > 100) aiText = aiText.slice(0, 100)
    return NextResponse.json({ success: true, name: postProcessName(aiText) || name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}
