import type { Metadata } from 'next'
import Link from 'next/link'
import { getProductsPaginated, getAllCategories } from '@/lib/queries'
import { Container } from '@/components/ui/Container'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Pagination } from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Catalogo | R&M Jewelry',
}

const PER_PAGE = 24

type PageProps = {
  searchParams: Promise<{ page?: string; category?: string }>
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const { page: pageParam, category: categoryParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const currentCategory = categoryParam || null

  const [productsResult, categoriesResult] = await Promise.all([
    getProductsPaginated({
      page: currentPage,
      limit: PER_PAGE,
      categorySlug: currentCategory || undefined,
    }).catch(() => ({
      docs: [] as any[],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
    })),
    getAllCategories().catch(() => ({ docs: [] as any[] })),
  ])

  const products = productsResult.docs
  const totalPages = productsResult.totalPages || 1
  const totalDocs = productsResult.totalDocs || 0
  const categories = categoriesResult.docs

  const buildHref = (page: number, category?: string | null) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    return qs ? `/products?${qs}` : '/products'
  }

  const pillBase =
    'shrink-0 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap'
  const pillActive = 'bg-brand-dark text-white'
  const pillIdle = 'bg-brand-cream text-brand-dark hover:bg-brand-dark hover:text-white'

  return (
    <Container className="py-8">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <h1 className="font-heading text-2xl font-semibold text-brand-dark">
          Catálogo
        </h1>
        {totalDocs > 0 && (
          <p className="text-sm text-brand-gray">
            {totalDocs} {totalDocs === 1 ? 'produto' : 'produtos'}
          </p>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-1 px-1 scrollbar-hide">
        <Link
          href={buildHref(1, null)}
          className={`${pillBase} ${!currentCategory ? pillActive : pillIdle}`}
        >
          Todos
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={buildHref(1, cat.slug)}
            className={`${pillBase} ${currentCategory === cat.slug ? pillActive : pillIdle}`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <ProductGrid products={products} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(p) => buildHref(p, currentCategory)}
      />
    </Container>
  )
}
