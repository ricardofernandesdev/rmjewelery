import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { name, imageUrl } = await req.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    }

    const userText =
      `Cria um nome de produto descritivo e único em português para esta peça de joalharia. ` +
      `Nome base: "${name.trim()}". ` +
      `Olha para a imagem e descreve visualmente a peça no nome (formato, detalhes, decoração, etc.). ` +
      `Devolve APENAS o nome melhorado (máximo 8 palavras), sem aspas, sem pontuação final, sem explicações. ` +
      `Estilo sofisticado e minimalista. Exemplos de bons nomes: ` +
      `"Pulseira Aço Entrelaçada Minimalista", "Anel Dourado com Pérola Central", "Brincos Aço Forma Geométrica".`

    // Single attempt, hard-capped well under Vercel's 10s function limit.
    // When we have an image, use Pollinations vision (OpenAI-compatible
    // POST). Otherwise, use the simpler GET text endpoint.
    let aiText = ''
    const started = Date.now()
    const HARD_BUDGET_MS = 8500 // leave ~1.5s headroom for the rest of the route

    try {
      if (imageUrl) {
        const visionRes = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(HARD_BUDGET_MS),
          body: JSON.stringify({
            model: 'openai-large',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: userText },
                  { type: 'image_url', image_url: { url: imageUrl } },
                ],
              },
            ],
          }),
        })
        if (visionRes.ok) {
          const data = await visionRes.json()
          aiText = data?.choices?.[0]?.message?.content?.trim() || ''
        }
      } else {
        // No image — go straight to text endpoint
        const remaining = Math.max(2000, HARD_BUDGET_MS - (Date.now() - started))
        const textRes = await fetch(
          `https://text.pollinations.ai/${encodeURIComponent(userText)}?model=openai`,
          { signal: AbortSignal.timeout(remaining) },
        )
        if (textRes.ok) aiText = (await textRes.text()).trim()
      }
    } catch {
      // Timed out or network error — fall through with empty aiText
    }

    // If vision returned nothing and we still have budget, try text as backup
    if (!aiText && imageUrl) {
      const remaining = HARD_BUDGET_MS - (Date.now() - started)
      if (remaining > 2500) {
        try {
          const textRes = await fetch(
            `https://text.pollinations.ai/${encodeURIComponent(userText)}?model=openai`,
            { signal: AbortSignal.timeout(remaining - 500) },
          )
          if (textRes.ok) aiText = (await textRes.text()).trim()
        } catch {
          /* give up */
        }
      }
    }

    if (!aiText) {
      return NextResponse.json({ error: 'Serviço de IA indisponível ou demasiado lento' }, { status: 502 })
    }

    if (!aiText || aiText.length > 100 || aiText.includes('\n')) {
      return NextResponse.json({ error: 'Resposta inválida' }, { status: 502 })
    }
    const cleaned = aiText.replace(/^["'"']|["'"']$/g, '').trim()
    return NextResponse.json({ success: true, name: cleaned || name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}
