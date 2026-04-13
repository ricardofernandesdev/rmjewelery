'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import type { Media } from '../../../payload-types'

type ProductGalleryProps = {
  images: Media[]
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [zooming, setZooming] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-brand-cream rounded-sm max-w-md" />
    )
  }

  const mainImage = images[selectedIndex]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  return (
    <div className="flex flex-col gap-3 max-w-lg">
      {/* Main image with zoom — all images are rendered but only the
          selected one is visible, so switching is instant (no re-fetch) */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-sm bg-white border border-gray-100 cursor-crosshair"
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMouseMove}
      >
        {images.map((image, index) => (
          <Image
            key={image.id}
            src={image.sizes?.detail?.url || image.url || ''}
            alt={image.alt || ''}
            width={image.sizes?.detail?.width || image.width || 800}
            height={image.sizes?.detail?.height || image.height || 800}
            sizes="(max-width: 768px) 100vw, 500px"
            placeholder={image.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={image.blurDataURL || undefined}
            className={`w-full h-auto object-contain ${index !== selectedIndex ? 'hidden' : ''}`}
            priority={index === 0}
            loading={index === 0 ? undefined : 'eager'}
            style={{
              transform: index === selectedIndex && zooming ? 'scale(2)' : 'scale(1)',
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              transition: index === selectedIndex && zooming ? 'none' : 'transform 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative shrink-0 w-16 h-16 rounded-sm overflow-hidden border transition-all ${
                index === selectedIndex
                  ? 'border-brand-dark opacity-100'
                  : 'border-gray-200 opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={image.sizes?.thumbnail?.url || image.url || ''}
                alt={image.alt || ''}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
