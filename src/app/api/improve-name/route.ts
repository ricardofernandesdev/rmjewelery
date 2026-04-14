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

    // Hard 6s ceiling enforced via Promise.race — AbortSignal.timeout alone
    // sometimes fails to cut off serverless fetches cleanly. One attempt,
    // no fallback, so we never push past Vercel's 10s function limit.
    const BUDGET_MS = 6000

    const withTimeout = <T,>(p: Promise<T>): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), BUDGET_MS),
        ),
      ])

    let aiText = ''
    try {
      if (imageUrl) {
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
                    { type: 'text', text: userText },
                    { type: 'image_url', image_url: { url: imageUrl } },
                  ],
                },
              ],
            }),
          }),
        )
        if (res.ok) {
          const data = await withTimeout(res.json())
          aiText = data?.choices?.[0]?.message?.content?.trim() || ''
        }
      } else {
        const res = await withTimeout(
          fetch(`https://text.pollinations.ai/${encodeURIComponent(userText)}?model=openai`),
        )
        if (res.ok) aiText = (await withTimeout(res.text())).trim()
      }
    } catch {
      // Timed out — return graceful error so client knows to retry
    }

    if (!aiText) {
      return NextResponse.json(
        { error: 'Serviço de IA indisponível ou demasiado lento. Tenta novamente.' },
        { status: 502 },
      )
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
