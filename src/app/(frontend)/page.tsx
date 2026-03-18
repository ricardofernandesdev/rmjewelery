import React from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'

export default function HomePage() {
  return (
    <Container className="py-20 sm:py-32">
      <div className="flex flex-col items-center text-center gap-6">
        <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight text-brand-dark">
          RM Jewelry
        </h1>
        <p className="text-lg text-brand-gray max-w-md">
          Explore nossa colecao de joias exclusivas, feitas com dedicacao e carinho.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-brand-dark text-white px-8 py-3 text-sm tracking-wide hover:bg-brand-gold transition-colors"
        >
          Ver Catalogo
        </Link>
      </div>
    </Container>
  )
}
