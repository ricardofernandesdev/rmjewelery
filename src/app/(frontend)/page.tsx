import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getHomeSettings, getAllCategories } from '@/lib/queries'
import { Container } from '@/components/ui/Container'

export const revalidate = 60 // revalidate every 60 seconds
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProductsGallery } from '@/components/home/FeaturedProductsGallery'

const getMediaUrl = (field: any): { url: string | null; alt: string } => {
  if (field && typeof field === 'object') {
    return { url: field.url || null, alt: field.alt || '' }
  }
  return { url: null, alt: '' }
}

export default async function HomePage() {
  const [settings, categoriesResult] = await Promise.all([
    getHomeSettings().catch(() => null),
    getAllCategories().catch(() => ({ docs: [] as any[] })),
  ])
  const categories = categoriesResult.docs

  const sections: any[] = (settings as any)?.sections || []

  return (
    <>
      {sections.map((block, idx) => {
        const key = `${block.blockType}-${idx}`

        if (block.blockType === 'hero') {
          const img = getMediaUrl(block.image)
          return (
            <HeroSection
              key={key}
              imageUrl={img.url}
              imageAlt={img.alt || 'Hero'}
              showEyebrow={block.showEyebrow !== false}
              eyebrow={block.eyebrow || ''}
              title={block.title || ''}
              showPrimary={block.showPrimaryButton !== false}
              primaryLabel={block.primaryButtonLabel || ''}
              primaryLink={block.primaryButtonLink || '/'}
              showSecondary={block.showSecondaryButton !== false}
              secondaryLabel={block.secondaryButtonLabel || ''}
              secondaryLink={block.secondaryButtonLink || '/'}
            />
          )
        }

        if (block.blockType === 'categoriesGrid') {
          const gridCategories = categories.slice(0, 4)
          return (
            <section key={key} className="py-20 md:py-28 bg-white">
              <Container>
                <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
                  <div className="max-w-xl">
                    <h2 className="font-heading italic text-4xl md:text-5xl text-brand-dark font-light leading-tight mb-4">
                      {block.title || 'Dimensões Essenciais'}
                    </h2>
                    <p className="text-sm text-brand-gray leading-relaxed max-w-md">
                      {block.description}
                    </p>
                  </div>
                  <p className="text-[10px] tracking-[0.3em] text-brand-gray uppercase">
                    {block.label || '01 / CATEGORIAS'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gridCategories.map((cat: any) => {
                    const catImg = cat.image && typeof cat.image === 'object' ? cat.image : null
                    const catImgUrl = catImg?.url || null
                    return (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.slug}`}
                        className="relative block h-72 md:h-80 overflow-hidden bg-brand-cream group"
                      >
                        {catImgUrl && (
                          <Image
                            src={catImgUrl}
                            alt={catImg?.alt || cat.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 text-white">
                          <h3 className="font-heading italic text-2xl md:text-3xl font-light mb-1">
                            {cat.name}
                          </h3>
                          {cat.description && (
                            <p className="text-[10px] tracking-[0.25em] uppercase text-white/80">
                              {cat.description.slice(0, 40)}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </Container>
            </section>
          )
        }

        if (block.blockType === 'philosophy') {
          const philImg = getMediaUrl(block.image)
          return (
            <section key={key} className="py-20 md:py-28 bg-brand-cream">
              <Container>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
                  <div className="relative">
                    <div className="relative h-80 md:h-96 overflow-hidden bg-brand-dark">
                      {philImg.url && (
                        <Image
                          src={philImg.url}
                          alt={philImg.alt || block.title || 'Filosofia'}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                    {block.showBadge !== false && block.badge && (
                      <div className="absolute -bottom-3 left-6 bg-brand-dark text-white px-5 py-2 text-[10px] tracking-[0.25em] uppercase">
                        {block.badge}
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-heading italic text-4xl md:text-5xl text-brand-dark font-light leading-tight mb-6">
                      {block.title}
                    </h2>
                    <p className="text-sm md:text-base text-brand-gray leading-relaxed mb-8 whitespace-pre-line">
                      {block.text}
                    </p>
                    {block.showLink !== false && block.linkLabel && (
                      <Link
                        href={block.linkUrl || '/'}
                        className="inline-block text-[10px] tracking-[0.3em] uppercase text-brand-dark border-b border-brand-dark pb-1 hover:text-brand-gold hover:border-brand-gold transition-colors"
                      >
                        {block.linkLabel}
                      </Link>
                    )}
                  </div>
                </div>
              </Container>
            </section>
          )
        }

        if (block.blockType === 'divider') {
          const spacingMap: Record<string, string> = {
            small: 'py-6',
            medium: 'py-12',
            large: 'py-20',
          }
          const bgMap: Record<string, string> = {
            white: 'bg-white',
            cream: 'bg-brand-cream',
            dark: 'bg-brand-dark',
          }
          const spacing = spacingMap[block.spacing || 'medium']
          const bg = bgMap[block.background || 'white']
          const isDark = block.background === 'dark'
          const lineColor = isDark ? 'border-white/20' : 'border-brand-dark/15'
          const ornamentColor = isDark ? 'text-white/40' : 'text-brand-dark/40'

          if (block.style === 'spacer') {
            return <div key={key} className={`${bg} ${spacing}`} />
          }

          if (block.style === 'ornament') {
            return (
              <div key={key} className={`${bg} ${spacing}`}>
                <Container>
                  <div className="flex items-center justify-center gap-4">
                    <div className={`flex-1 border-t ${lineColor}`} />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="14"
                      height="14"
                      className={ornamentColor}
                    >
                      <path d="M12 2l2.39 7.36H22l-6.19 4.5L18.18 22 12 17.27 5.82 22l2.37-8.14L2 9.36h7.61z" />
                    </svg>
                    <div className={`flex-1 border-t ${lineColor}`} />
                  </div>
                </Container>
              </div>
            )
          }

          // default: simple line
          return (
            <div key={key} className={`${bg} ${spacing}`}>
              <Container>
                <div className={`border-t ${lineColor}`} />
              </Container>
            </div>
          )
        }

        if (block.blockType === 'featuredProducts') {
          const products = (block.products || []).filter((p: any) => typeof p === 'object')
          return (
            <FeaturedProductsGallery
              key={key}
              eyebrow={block.eyebrow}
              title={block.title}
              products={products}
            />
          )
        }

        return null
      })}
    </>
  )
}
