import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPageBySlug, getAllPages } from '@/lib/queries'
import { Container } from '@/components/ui/Container'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const { docs } = await getAllPages()
    return docs.map((page: any) => ({ slug: page.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const page = await getPageBySlug(slug)
    if (!page) return {}
    return { title: `${page.title} | RM Jewelry` }
  } catch {
    return {}
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params
  const page = await getPageBySlug(slug).catch(() => null)

  if (!page) notFound()

  return (
    <Container className="py-16 md:py-24 max-w-3xl mx-auto">
      <h1 className="font-heading italic text-4xl md:text-5xl text-brand-dark text-center mb-12">
        {page.title}
      </h1>

      <hr className="border-gray-200 mb-12" />

      <div className="prose prose-sm md:prose-base text-brand-gray max-w-none">
        {page.content && <RichText data={page.content} />}
      </div>
    </Container>
  )
}
