'use client'
import React, { useState } from 'react'
import { ProductGallery } from './ProductGallery'
import { VariantSelector } from './VariantSelector'
import type { Media } from '../../../payload-types'

type SizeEntry = {
  value: string
  price?: number | null
  availability?: string
}

type Color = {
  name: string
  hex: string
  price?: number | null
  availability?: string
  images?: any[]
  sizes?: SizeEntry[]
}

type Props = {
  mainImages: Media[]
  colors: Color[]
  sizes: SizeEntry[]
  basePrice: number
  children?: React.ReactNode
}

export const ProductDetailClient: React.FC<Props> = ({
  mainImages,
  colors,
  sizes,
  basePrice,
  children,
}) => {
  const [activeImages, setActiveImages] = useState<Media[]>(mainImages)
  const hasOptions = colors.length > 0 || sizes.length > 0

  const handleSelectionChange = (selection: { color?: Color; images?: any[] }) => {
    if (selection.images && selection.images.length > 0) {
      const variantMedia = selection.images.filter(
        (img: any): img is Media => typeof img === 'object' && img !== null,
      )
      if (variantMedia.length > 0) {
        const variantIds = new Set(variantMedia.map((m) => m.id))
        const remaining = mainImages.filter((m) => !variantIds.has(m.id))
        setActiveImages([...variantMedia, ...remaining])
        return
      }
    }
    setActiveImages(mainImages)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      <ProductGallery images={activeImages} />

      <div className="flex flex-col gap-3">
        {children}

        {hasOptions && (
          <VariantSelector
            colors={colors}
            sizes={sizes}
            basePrice={basePrice}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </div>
    </div>
  )
}
