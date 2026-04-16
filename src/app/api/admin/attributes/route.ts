import { NextResponse } from 'next/server'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from '@/lib/payload'

async function requireAdmin() {
  const payload = await getPayload()
  const hdrs = await nextHeaders()
  const { user } = await payload.auth({ headers: hdrs })
  if (!user) return { payload, user: null as null }
  return { payload, user }
}

type ColorDoc = { id: number | string; name: string; hex?: string; slug: string }
type SizeDoc = { id: number | string; name: string; slug: string }

export async function GET(req: Request) {
  const { payload, user } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '30', 10) || 30))
  const categoryId = url.searchParams.get('category') || ''
  const search = (url.searchParams.get('search') || '').trim()

  const where: Record<string, unknown> = {}
  if (categoryId) where.category = { equals: Number(categoryId) || categoryId }
  if (search) where.name = { like: search }

  const [products, allColorsRes, allSizesRes] = await Promise.all([
    payload.find({
      collection: 'products',
      where: Object.keys(where).length ? (where as never) : undefined,
      page,
      limit,
      sort: 'name',
      depth: 2,
    }),
    payload.find({ collection: 'colors', limit: 0, depth: 0, sort: 'sortOrder' }),
    payload.find({ collection: 'sizes', limit: 0, depth: 0, sort: 'sortOrder' }),
  ])

  const allColors: ColorDoc[] = (allColorsRes.docs as ColorDoc[]).map((c) => ({
    id: c.id,
    name: c.name,
    hex: c.hex,
    slug: c.slug,
  }))
  const allSizes: SizeDoc[] = (allSizesRes.docs as SizeDoc[]).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
  }))

  const docs = products.docs.map((p) => {
    const product = p as {
      id: number | string
      name: string
      slug: string
      enableColors?: boolean
      enableSizes?: boolean
      category?: { id: number | string; name: string } | number | string
      colors?: Array<ColorDoc | number | string>
      sizes?: Array<SizeDoc | number | string>
      images?: Array<
        | { url?: string; sizes?: { thumbnail?: { url?: string }; card?: { url?: string } } }
        | number
        | string
      >
      variants?: Array<{
        id?: string
        color?: string | number
        sizes?: Array<SizeDoc | number | string>
        price?: number | null
        availability?: 'in_stock' | 'out_of_stock'
        images?: unknown[]
      }>
    }
    const cat = product.category
    const categoryName =
      cat && typeof cat === 'object' && 'name' in cat ? cat.name : null

    const firstImage = product.images?.[0]
    const imageUrl =
      firstImage && typeof firstImage === 'object'
        ? firstImage.sizes?.thumbnail?.url ||
          firstImage.sizes?.card?.url ||
          firstImage.url ||
          null
        : null

    const colorIds = (product.colors ?? [])
      .map((c) => (typeof c === 'object' && c ? c.id : c))
      .filter((v): v is number | string => v !== undefined && v !== null)

    const sizeIds = (product.sizes ?? [])
      .map((s) => (typeof s === 'object' && s ? s.id : s))
      .filter((v): v is number | string => v !== undefined && v !== null)

    const variants = (product.variants ?? []).map((v) => ({
      id: v.id,
      colorId: v.color ?? null,
      sizeIds: (v.sizes ?? [])
        .map((s) => (typeof s === 'object' && s ? s.id : s))
        .filter((x): x is number | string => x !== undefined && x !== null),
      price: typeof v.price === 'number' ? v.price : null,
      availability: v.availability || 'in_stock',
    }))

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      categoryName,
      imageUrl,
      enableColors: Boolean(product.enableColors),
      enableSizes: Boolean(product.enableSizes),
      colorIds,
      sizeIds,
      variants,
    }
  })

  return NextResponse.json({
    docs,
    page: products.page,
    totalPages: products.totalPages,
    totalDocs: products.totalDocs,
    hasNextPage: products.hasNextPage,
    allColors,
    allSizes,
  })
}

type PatchBody = {
  id: number | string
  colors?: Array<number | string>
  sizes?: Array<number | string>
  variantPatches?: Array<{ id: string; availability?: 'in_stock' | 'out_of_stock' }>
  deleteVariantIds?: string[]
}

export async function PATCH(req: Request) {
  const { payload, user } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body?.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (Array.isArray(body.colors)) data.colors = body.colors
  if (Array.isArray(body.sizes)) data.sizes = body.sizes

  const needVariantsMutation =
    (Array.isArray(body.variantPatches) && body.variantPatches.length > 0) ||
    (Array.isArray(body.deleteVariantIds) && body.deleteVariantIds.length > 0)

  if (needVariantsMutation) {
    const current = (await payload.findByID({
      collection: 'products',
      id: body.id,
      depth: 0,
    })) as {
      variants?: Array<{ id?: string; availability?: string; [k: string]: unknown }>
    }

    const deleteSet = new Set(body.deleteVariantIds ?? [])
    const patchMap = new Map(
      (body.variantPatches ?? []).map((p) => [p.id, p.availability]),
    )

    const nextVariants = (current.variants ?? [])
      .filter((v) => !v.id || !deleteSet.has(v.id))
      .map((v) => {
        if (v.id && patchMap.has(v.id)) {
          const nextAvail = patchMap.get(v.id)
          if (nextAvail) return { ...v, availability: nextAvail }
        }
        return v
      })

    data.variants = nextVariants
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    await payload.update({
      collection: 'products',
      id: body.id,
      data: data as never,
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Update failed' },
      { status: 500 },
    )
  }
}
