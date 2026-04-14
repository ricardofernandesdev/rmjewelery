import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

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
      `Cria um nome de produto descritivo e único em português para esta peça de joalharia. ` +
      `Nome base: "${name.trim()}". ` +
      (imageUrl
        ? `Olha atentamente para a imagem e descreve no nome os detalhes visuais específicos ` +
          `(formato, pérolas, zircónias, decoração, acabamento, cor, etc.). `
        : '') +
      `REGRA ABSOLUTA: NÃO uses a palavra "aço" nem "Aço" no nome. Nunca. Se a peça for em aço, ` +
      `descreve-a por outras qualidades (forma, design, decoração, acabamento). ` +
      `Devolve APENAS o nome melhorado (máximo 8 palavras), sem aspas, sem pontuação final, ` +
      `sem explicações, sem quebras de linha. ` +
      `Estilo sofisticado e minimalista. Exemplos: ` +
      `"Pulseira Entrelaçada Minimalista", "Anel Dourado com Pérola Central", ` +
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
    try {
      const res = await withTimeout(
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
        const errData = await res.text()
        console.error('Gemini error:', res.status, errData)
      }
    } catch {
      /* timeout */
    }

    if (!aiText) {
      return NextResponse.json(
        { error: 'Serviço de IA indisponível ou demasiado lento.' },
        { status: 502 },
      )
    }

    // Clean response
    if (aiText.includes('\n')) aiText = aiText.split('\n')[0].trim()
    if (aiText.length > 100) aiText = aiText.slice(0, 100)
    // Strip any stray "aço" / "Aço" the model might have slipped in
    const cleaned = aiText
      .replace(/^["'"']|["'"']$/g, '')
      .replace(/\.$/, '')
      .replace(/\s+(de|em)?\s*aço\b/gi, '')
      .replace(/\baço\s+/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    return NextResponse.json({ success: true, name: cleaned || name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}
