import { NextResponse } from 'next/server'
import {
  getProductsPaginated,
  type ProductSort,
  type ProductAvailability,
} from '@/lib/queries'

const VALID_SORTS: ProductSort[] = ['sortOrder', 'price_asc', 'price_desc', 'name_asc', 'name_desc']
const VALID_AVAIL: ProductAvailability[] = ['all', 'in_stock', 'out_of_stock']

export async function GET(req: Request) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug') || undefined
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(60, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20))

  const availabilityRaw = url.searchParams.get('availability') as ProductAvailability | null
  const availability: ProductAvailability =
    availabilityRaw && VALID_AVAIL.includes(availabilityRaw) ? availabilityRaw : 'all'

  const sortRaw = url.searchParams.get('sort') as ProductSort | null
  const sort: ProductSort = sortRaw && VALID_SORTS.includes(sortRaw) ? sortRaw : 'sortOrder'

  const minPriceRaw = url.searchParams.get('minPrice')
  const maxPriceRaw = url.searchParams.get('maxPrice')
  const minPrice = minPriceRaw !== null ? Number(minPriceRaw) : undefined
  const maxPrice = maxPriceRaw !== null ? Number(maxPriceRaw) : undefined

  try {
    const result = await getProductsPaginated({
      page,
      limit,
      categorySlug: slug,
      availability,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      sort,
    })
    return NextResponse.json({
      docs: result.docs,
      page: result.page,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
    })
  } catch {
    return NextResponse.json({ error: 'Erro a buscar produtos' }, { status: 500 })
  }
}
