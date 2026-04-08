import React from 'react'

type Props = {
  mode: 'maintenance' | 'coming-soon'
  message: string
}

export const SiteStatusGate: React.FC<Props> = ({ mode, message }) => {
  const isMaintenance = mode === 'maintenance'
  return (
    <div className="font-body min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="max-w-xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-brand-gray uppercase mb-4">
          RM JEWELRY
        </p>
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-brand-dark mb-6">
          {isMaintenance ? 'EM MANUTENÇÃO' : 'EM BREVE'}
        </h1>
        <p className="text-brand-gray text-base md:text-lg leading-relaxed">{message}</p>
        {!isMaintenance && (
          <p className="mt-10 text-xs tracking-[0.2em] text-brand-gray uppercase">
            Obrigado pela tua paciência
          </p>
        )}
      </div>
    </div>
  )
}
