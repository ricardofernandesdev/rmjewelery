import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllProducts, getAllCategories } from '@/lib/queries'
import { Container } from '@/components/ui/Container'
import { ProductGrid } from '@/components/product/ProductGrid'

export const metadata: Metadata = {
  title: 'Catalogo | RM Jewelry',
}

export default async function CatalogPage() {
  const [{ docs: products }, { docs: categories }] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ])

  return (
    <Container className="py-8">
      <h1 className="font-heading text-2xl font-semibold text-brand-dark mb-6">
        Catalogo
      </h1>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-1 px-1 scrollbar-hide">
        <Link
          href="/products"
          className="shrink-0 px-4 py-2 rounded-full text-sm bg-brand-dark text-white transition-colors"
        >
          Todos
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="shrink-0 px-4 py-2 rounded-full text-sm bg-brand-cream text-brand-dark hover:bg-brand-dark hover:text-white transition-colors"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <ProductGrid products={products} />
    </Container>
  )
}
