'use client'
import React, { useState } from 'react'
import Image from 'next/image'

type Variant = {
  name: string
  price?: number | null
  availability?: string
  images?: any[]
}

type Props = {
  variants: Variant[]
  basePrice: number
  onVariantChange?: (variant: Variant, index: number) => void
}

export const VariantSelector: React.FC<Props> = ({ variants, basePrice, onVariantChange }) => {
  const [selected, setSelected] = useState(0)

  if (!variants || variants.length === 0) return null

  const handleSelect = (index: number) => {
    setSelected(index)
    onVariantChange?.(variants[index], index)
  }

  const current = variants[selected]
  const currentPrice = current.price ?? basePrice
  const isOutOfStock = current.availability === 'out_of_stock'

  return (
    <div className="space-y-4">
      {/* Variant buttons */}
      <div>
        <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">
          Opção: <span className="text-brand-dark font-medium">{current.name}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant, i) => {
            const variantOutOfStock = variant.availability === 'out_of_stock'
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(i)}
                className={`px-4 py-2 text-sm border transition-colors ${
                  i === selected
                    ? 'border-brand-dark bg-brand-dark text-white'
                    : variantOutOfStock
                      ? 'border-gray-200 text-brand-gray/50 line-through cursor-not-allowed'
                      : 'border-gray-200 text-brand-dark hover:border-brand-dark'
                }`}
                disabled={variantOutOfStock}
              >
                {variant.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price */}
      <p className="text-xl font-semibold text-brand-dark">
        {currentPrice.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
      </p>

      {/* Stock status */}
      {isOutOfStock && (
        <p className="text-sm text-red-500 font-medium">Esgotado</p>
      )}
    </div>
  )
}
