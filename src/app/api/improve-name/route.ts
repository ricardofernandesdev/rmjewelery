import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

/**
 * Generate a descriptive product name from a base name and (optional)
 * image description obtained via /api/analyze-image. Text-only prompt,
 * fast enough to run comfortably within Vercel's 10s limit.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { name, description } = await req.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    }

    const prompt =
      `Cria um nome de produto descritivo e único em português para uma peça de joalharia. ` +
      `Nome base: "${name.trim()}". ` +
      (description ? `Descrição visual da peça: "${description}". ` : '') +
      `Usa a descrição visual para destacar detalhes específicos (material, forma, decoração). ` +
      `Devolve APENAS o nome melhorado (máximo 8 palavras), sem aspas, sem pontuação final, sem explicações. ` +
      `Estilo sofisticado e minimalista. Exemplos: ` +
      `"Pulseira Aço Entrelaçada Minimalista", "Anel Dourado com Pérola Central", "Brincos Aço Forma Geométrica".`

    // Text-only budget — 7s gives Pollinations room on slow days while
    // keeping 3s margin before Vercel's 10s function limit.
    const BUDGET_MS = 7000
    const withTimeout = <T,>(p: Promise<T>): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), BUDGET_MS)),
      ])

    let aiText = ''
    try {
      const res = await withTimeout(
        fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`),
      )
      if (res.ok) aiText = (await withTimeout(res.text())).trim()
    } catch {
      /* timeout */
    }

    if (!aiText) {
      return NextResponse.json(
        { error: 'Serviço de IA indisponível ou demasiado lento. Tenta novamente.' },
        { status: 502 },
      )
    }

    if (aiText.length > 100 || aiText.includes('\n')) {
      // Take only the first line if multi-line
      aiText = aiText.split('\n')[0].trim()
      if (aiText.length > 100) aiText = aiText.slice(0, 100)
    }

    const cleaned = aiText.replace(/^["'"']|["'"']$/g, '').trim()
    return NextResponse.json({ success: true, name: cleaned || name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}
