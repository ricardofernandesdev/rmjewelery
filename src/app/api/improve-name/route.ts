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

    // If we have an image, use Pollinations vision via POST (OpenAI-compatible format)
    let aiText = ''
    try {
      if (imageUrl) {
        const visionRes = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
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
      }
    } catch {
      // Vision failed, fall through to text-only
    }

    // Fallback: text-only prompt
    if (!aiText) {
      const textRes = await fetch(
        `https://text.pollinations.ai/${encodeURIComponent(userText)}?model=openai`,
        { signal: AbortSignal.timeout(8000) },
      )
      if (!textRes.ok) {
        return NextResponse.json({ error: 'Serviço de IA indisponível' }, { status: 502 })
      }
      aiText = (await textRes.text()).trim()
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
