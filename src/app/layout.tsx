import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RM Jewelry',
  description: 'Catalogo digital de joias em aco inoxidavel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  )
}
