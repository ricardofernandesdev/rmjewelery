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

    const { name } = await req.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    }

    const prompt =
      `Cria um nome de produto descritivo e atrativo em português para uma peça de joalharia. ` +
      `Nome base: "${name.trim()}". ` +
      `Devolve APENAS o nome melhorado (máximo 8 palavras), sem aspas, sem pontuação final, sem explicações. ` +
      `Mantém o estilo sofisticado e minimalista. Exemplos de bons nomes: ` +
      `"Pulseira Aço Entrelaçada Minimalista", "Anel Dourado com Pérola Central", "Brincos Aço Forma Geométrica".`

    const aiRes = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!aiRes.ok) {
      return NextResponse.json({ error: 'Serviço de IA indisponível' }, { status: 502 })
    }
    const improved = (await aiRes.text()).trim()
    if (!improved || improved.length > 100 || improved.includes('\n')) {
      return NextResponse.json({ error: 'Resposta inválida' }, { status: 502 })
    }
    const cleaned = improved.replace(/^["'"']|["'"']$/g, '').trim()
    return NextResponse.json({ success: true, name: cleaned || name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}
