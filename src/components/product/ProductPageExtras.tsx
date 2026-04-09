'use client'
import React from 'react'
import { SimilarProducts } from './SimilarProducts'
import { RecentlyViewed, useTrackView } from './RecentlyViewed'

type SimpleProduct = {
  id: string | number
  name: string
  slug: string
  price?: number
  imageUrl?: string | null
  imageAlt?: string
}

type Props = {
  currentProduct: SimpleProduct
  similarProducts: SimpleProduct[]
}

export const ProductPageExtras: React.FC<Props> = ({ currentProduct, similarProducts }) => {
  // Track this product view in localStorage
  useTrackView(currentProduct)

  return (
    <>
      <SimilarProducts products={similarProducts} />
      <RecentlyViewed currentProductId={currentProduct.id} />
    </>
  )
}
