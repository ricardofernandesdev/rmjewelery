import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

/**
 * Generate a 2-paragraph product description via Gemini 2.0 Flash.
 * Returns the text content and the corresponding Lexical JSON so the
 * client can write straight into the richText form field.
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
    const productName = name.trim()

    const prompt =
      `Escreve uma descrição de produto em PORTUGUÊS DE PORTUGAL (pt-PT) para esta peça de joalharia.\n\n` +
      `Nome do produto: "${productName}".\n\n` +
      `Regras:\n` +
      `- Usa SEMPRE português europeu. NUNCA espanhol nem português brasileiro. ` +
      `Exemplos: "Prateado" (não "Plateado"), "Dourado" (não "Dorado"), "Prata" (não "Plata").\n` +
      `- Exactamente 2 parágrafos separados por uma linha em branco.\n` +
      `- 1º parágrafo: começa SEMPRE com "${productName}" e descreve a peça (materiais, formato, detalhes observáveis na imagem) e para quem se destina.\n` +
      `- 2º parágrafo: fala sobre ocasiões de uso e o estilo/sensação que transmite.\n` +
      `- Estilo: elegante, sofisticado, minimalista. Evita repetição.\n` +
      `- Cada parágrafo entre 2-4 frases.\n` +
      `- NÃO uses markdown, NÃO uses aspas à volta dos parágrafos, NÃO adiciones títulos.\n` +
      `- Devolve APENAS os dois parágrafos.`

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
        /* proceed text-only */
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
                temperature: 0.9,
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
          { error: 'Limite de IA atingido. Aguarda 1 minuto e tenta novamente.' },
          { status: 429 },
        )
      }
      const detail = geminiError ? ` (${geminiError.status}: ${geminiError.message})` : ''
      return NextResponse.json({ error: `Serviço de IA indisponível${detail}` }, { status: 502 })
    }

    // Clean up: remove stray markdown, split into paragraphs
    // pt-PT fixes for stray Spanish/pt-BR words
    const ptFixes: Array<[RegExp, string]> = [
      [/\bplateado\b/gi, 'Prateado'],
      [/\bplateada\b/gi, 'Prateada'],
      [/\bdorado\b/gi, 'Dourado'],
      [/\bdorada\b/gi, 'Dourada'],
      [/\bplata\b/gi, 'Prata'],
      [/\boro\b/gi, 'Ouro'],
    ]
    const fixPt = (s: string) => ptFixes.reduce((acc, [p, r]) => acc.replace(p, r), s)

    const paragraphs = aiText
      .replace(/^["'""]|["'""]$/g, '')
      .replace(/^\*+|\*+$/g, '')
      .split(/\n\s*\n/)
      .map((p) => fixPt(p.trim()))
      .filter(Boolean)
      .slice(0, 3)

    if (paragraphs.length === 0) {
      return NextResponse.json({ error: 'Resposta AI vazia' }, { status: 502 })
    }

    // Build Lexical JSON — product name in bold within the first paragraph
    const lexicalChildren = paragraphs.map((para, idx) => {
      if (idx === 0) {
        const boldIdx = para.indexOf(productName)
        if (boldIdx >= 0) {
          const before = para.slice(0, boldIdx)
          const after = para.slice(boldIdx + productName.length)
          const children: any[] = []
          if (before) children.push({ type: 'text', text: before, version: 1 })
          children.push({ type: 'text', text: productName, format: 1, version: 1 })
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

    const description = {
      root: {
        type: 'root',
        children: lexicalChildren,
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }

    return NextResponse.json({ success: true, description, preview: paragraphs.join('\n\n') })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}
