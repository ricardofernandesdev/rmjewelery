import type { Product } from '../../../payload-types'
import { ProductCard } from './ProductCard'

type ProductGridProps = {
  products: Product[]
  emptyMessage?: string
}

export function ProductGrid({
  products,
  emptyMessage = 'Nenhum produto encontrado.',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="text-center text-brand-gray py-12">{emptyMessage}</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
