import React from 'react'
import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'R&M Jewelry',
    template: '%s | R&M Jewelry',
  },
  description: 'Peças de joalharia minimalistas e elegantes — R&M Jewelry.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={manrope.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
