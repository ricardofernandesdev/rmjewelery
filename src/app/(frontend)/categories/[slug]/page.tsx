import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  getCategoryBySlug,
  getProductsByCategory,
  getAllCategories,
} from '@/lib/queries'
import { Container } from '@/components/ui/Container'
import { CategoryPageClient } from '@/components/product/CategoryPageClient'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const { docs } = await getAllCategories()
    return docs.map((cat) => ({ slug: cat.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const category = await getCategoryBySlug(slug)
    if (!category) return {}
    return {
      title: `${category.name} | RM Jewelry`,
    }
  } catch {
    return {}
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const [category, productsResult] = await Promise.all([
    getCategoryBySlug(slug).catch(() => null),
    getProductsByCategory(slug, 200).catch(() => ({ docs: [] as any[] })),
  ])
  const products = productsResult.docs

  if (!category) notFound()

  const catImage =
    category.image && typeof category.image === 'object' ? (category.image as any) : null
  const catImageUrl = catImage?.url || null
  const posX = (category as any).bannerPositionX || 'center'
  const posY = (category as any).bannerPositionY || 'center'

  return (
    <>
      {/* ── Hero banner ── */}
      <section className="relative w-full h-[300px] md:h-[400px] bg-brand-dark overflow-hidden -mt-[140px] pt-[140px]">
        {catImageUrl && (
          <Image
            src={catImageUrl}
            alt={catImage?.alt || category.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: `${posX} ${posY}` }}
          />
        )}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-heading text-white text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wider mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-white/80 text-sm md:text-base italic max-w-2xl leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* ── Filters + Products ── */}
      <Container className="py-6">
        <CategoryPageClient products={products} categoryName={category.name} />
      </Container>
    </>
  )
}
