import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export async function POST() {
  try {
    // Verify the request is from an authenticated admin
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Revalidate all frontend paths
    revalidatePath('/', 'layout')
    revalidatePath('/', 'page')
    revalidatePath('/products', 'page')
    revalidatePath('/about', 'page')
    revalidatePath('/care-guide', 'page')
    revalidatePath('/ring-size-guide', 'page')
    revalidatePath('/search', 'page')
    revalidatePath('/categories/[slug]', 'page')
    revalidatePath('/products/[slug]', 'page')

    return NextResponse.json({ success: true, message: 'Cache limpa com sucesso' })
  } catch {
    return NextResponse.json({ error: 'Erro ao limpar cache' }, { status: 500 })
  }
}
