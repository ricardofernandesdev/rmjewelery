'use client'
import React, { useState } from 'react'
import { ProductGallery } from './ProductGallery'
import { VariantSelector } from './VariantSelector'
import type { Media } from '../../../payload-types'

type ColorTerm = { name: string; hex: string; images?: any[] }
type SizeTerm = { value: string }
type Variant = { color?: string; size?: string; price?: number | null; availability?: string; images?: any[] }

type Props = {
  mainImages: Media[]
  colorTerms: ColorTerm[]
  sizeTerms: SizeTerm[]
  variants: Variant[]
  basePrice: number
  children?: React.ReactNode
}

export const ProductDetailClient: React.FC<Props> = ({
  mainImages,
  colorTerms,
  sizeTerms,
  variants,
  basePrice,
  children,
}) => {
  const [activeImages, setActiveImages] = useState<Media[]>(mainImages)
  const hasOptions = colorTerms.length > 0 || sizeTerms.length > 0

  const handleSelectionChange = (selection: { images?: any[] }) => {
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
            colorTerms={colorTerms}
            sizeTerms={sizeTerms}
            variants={variants}
            basePrice={basePrice}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </div>
    </div>
  )
}
