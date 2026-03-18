import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCategoryBySlug,
  getProductsByCategory,
  getAllCategories,
} from '@/lib/queries'
import { Container } from '@/components/ui/Container'
import { ProductGrid } from '@/components/product/ProductGrid'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const { docs } = await getAllCategories()
  return docs.map((cat) => ({ slug: cat.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return {
    title: `${category.name} | RM Jewelry`,
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const [category, { docs: products }, { docs: categories }] =
    await Promise.all([
      getCategoryBySlug(slug),
      getProductsByCategory(slug),
      getAllCategories(),
    ])

  if (!category) notFound()

  return (
    <Container className="py-8">
      <h1 className="font-heading text-2xl font-semibold text-brand-dark mb-6">
        {category.name}
      </h1>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-1 px-1 scrollbar-hide">
        <Link
          href="/products"
          className="shrink-0 px-4 py-2 rounded-full text-sm bg-brand-cream text-brand-dark hover:bg-brand-dark hover:text-white transition-colors"
        >
          Todos
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className={`shrink-0 px-4 py-2 rounded-full text-sm transition-colors ${
              cat.slug === slug
                ? 'bg-brand-dark text-white'
                : 'bg-brand-cream text-brand-dark hover:bg-brand-dark hover:text-white'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <ProductGrid
        products={products}
        emptyMessage={`Nenhum produto encontrado em ${category.name}.`}
      />
    </Container>
  )
}
