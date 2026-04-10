import React from 'react'
import { headers as nextHeaders } from 'next/headers'
import '../globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MainWrapper } from '@/components/layout/MainWrapper'
import { DiamondLoader } from '@/components/layout/DiamondLoader'
import { SiteStatusGate } from '@/components/layout/SiteStatusGate'
import { getSiteSettings } from '@/lib/queries'
import { getPayload } from '@/lib/payload'

export const revalidate = 60

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings().catch(() => null)

  // Check if logged in — admins bypass maintenance/coming-soon
  let isAuthenticated = false
  if (settings?.maintenanceMode || settings?.comingSoon) {
    try {
      const payload = await getPayload()
      const headers = await nextHeaders()
      const { user } = await payload.auth({ headers })
      isAuthenticated = Boolean(user)
    } catch {
      isAuthenticated = false
    }
  }

  if (settings?.maintenanceMode && !isAuthenticated) {
    return (
      <SiteStatusGate
        mode="maintenance"
        message={settings.maintenanceMessage || 'Estamos a fazer melhorias. Voltamos em breve.'}
      />
    )
  }

  if (settings?.comingSoon && !isAuthenticated) {
    return (
      <SiteStatusGate
        mode="coming-soon"
        message={settings.comingSoonMessage || 'Estamos a preparar algo especial. Em breve.'}
      />
    )
  }

  return (
    <div className="font-body min-h-screen flex flex-col bg-white relative">
      <DiamondLoader />
      <Header />
      <MainWrapper>{children}</MainWrapper>
      <Footer />
    </div>
  )
}
