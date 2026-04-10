'use client'
import React from 'react'
import { SimilarProducts } from './SimilarProducts'
import { RecentlyViewed } from './RecentlyViewed'

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
  return (
    <>
      <SimilarProducts products={similarProducts} />
      <RecentlyViewed currentProduct={currentProduct} />
    </>
  )
}
