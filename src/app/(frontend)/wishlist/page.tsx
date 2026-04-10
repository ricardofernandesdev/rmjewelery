import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { WishlistClient } from '@/components/product/WishlistClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Favoritos | RM Jewelry',
}

export default function WishlistPage() {
  return (
    <Container className="py-12 md:py-16">
      <h1 className="font-heading italic text-4xl md:text-5xl text-brand-dark text-center mb-10">
        Os Meus Favoritos
      </h1>
      <WishlistClient />
    </Container>
  )
}
