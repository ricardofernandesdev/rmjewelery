import type { Metadata } from 'next'
import { searchProducts } from '@/lib/queries'
import { Container } from '@/components/ui/Container'
import { ProductGrid } from '@/components/product/ProductGrid'
import { SearchBox } from '@/components/layout/SearchBox'

export const metadata: Metadata = {
  title: 'Pesquisa | RM Jewelry',
}

type Props = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const q = params.q?.trim() || ''
  const { docs: products, totalDocs } = q
    ? await searchProducts(q)
    : { docs: [], totalDocs: 0 }

  return (
    <Container className="py-8">
      <h1 className="font-heading text-2xl font-semibold text-brand-dark mb-6">
        Pesquisa
      </h1>

      <div className="mb-8 max-w-2xl">
        <SearchBox initialValue={q} autoFocus />
      </div>

      {q ? (
        <>
          <p className="text-sm text-brand-gray mb-6">
            {totalDocs > 0
              ? `${totalDocs} resultado${totalDocs > 1 ? 's' : ''} para "${q}"`
              : `Nenhum resultado para "${q}"`}
          </p>
          {products.length > 0 && <ProductGrid products={products} />}
        </>
      ) : (
        <p className="text-sm text-brand-gray">
          Escreve para procurar produtos.
        </p>
      )}
    </Container>
  )
}
