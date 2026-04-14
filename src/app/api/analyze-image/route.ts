import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

/**
 * Analyze a product image via Pollinations vision and return a short
 * concrete description (material, colour, shape, distinguishing features).
 * The client then passes this description to /api/improve-name which is
 * fast (text-only). Splitting the slow vision call from the fast name
 * generation keeps each request well under Vercel's 10s limit.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { imageUrl } = await req.json()
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'imageUrl obrigatório' }, { status: 400 })
    }

    const prompt =
      'Descreve esta peça de joalharia numa só frase curta e objetiva em português. ' +
      'Inclui: material (aço, dourado, prateado...), forma geral (pulseira, anel, brinco, colar), ' +
      'detalhes visíveis (pérolas, zircónias, flores, corações, formato, acabamento). ' +
      'Não uses pontuação final. Exemplo: "pulseira prateada com três pérolas brancas e fecho articulado"'

    // Hard 8.5s ceiling via Promise.race
    const BUDGET_MS = 8500
    const withTimeout = <T,>(p: Promise<T>): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), BUDGET_MS)),
      ])

    let description = ''
    try {
      const res = await withTimeout(
        fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai-large',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageUrl } },
                ],
              },
            ],
          }),
        }),
      )
      if (res.ok) {
        const data = await withTimeout(res.json())
        description = data?.choices?.[0]?.message?.content?.trim() || ''
      }
    } catch {
      // timeout or network error
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Análise de imagem indisponível ou demasiado lenta. Tenta novamente.' },
        { status: 502 },
      )
    }

    // Sanity-trim the description
    description = description.replace(/^["'"']|["'"']$/g, '').replace(/\.$/, '').trim()
    if (description.length > 300) description = description.slice(0, 300)

    return NextResponse.json({ success: true, description })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}
