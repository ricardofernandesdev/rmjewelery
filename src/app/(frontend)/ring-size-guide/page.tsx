import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Guia de tamanhos dos anéis | RM Jewelry',
}

const sizes = [
  { diameter: '17mm', size: '17' },
  { diameter: '18mm', size: '18' },
  { diameter: '19mm', size: '19' },
  { diameter: '20mm', size: '20' },
  { diameter: '21mm', size: '21' },
  { diameter: '22mm', size: '22' },
  { diameter: '23mm', size: '23' },
]

export default function RingSizeGuidePage() {
  return (
    <Container className="py-16 md:py-24 max-w-3xl mx-auto">
      <h1 className="font-heading italic text-4xl md:text-5xl text-brand-dark text-center mb-16">
        Guia de tamanhos dos anéis
      </h1>

      {/* Ring illustration */}
      <div className="flex flex-col items-center mb-16">
        <svg width="200" height="220" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-dark">
          {/* Diamond */}
          <path d="M90 20L100 8L110 20L100 45Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
          <path d="M90 20L110 20" stroke="currentColor" strokeWidth="1.5" />
          <path d="M95 14L105 14" stroke="currentColor" strokeWidth="1" opacity="0.5" />

          {/* Ring */}
          <ellipse cx="100" cy="80" rx="45" ry="45" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <ellipse cx="100" cy="80" rx="35" ry="35" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />

          {/* Diameter line */}
          <line x1="55" y1="80" x2="145" y2="80" stroke="#e8a87c" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="55" cy="80" r="2" fill="#e8a87c" />
          <circle cx="145" cy="80" r="2" fill="#e8a87c" />

          {/* Vertical guide line */}
          <line x1="100" y1="125" x2="100" y2="165" stroke="currentColor" strokeWidth="1" opacity="0.4" strokeDasharray="3 3" />

          {/* Ruler */}
          <rect x="40" y="170" width="130" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          {/* Ruler ticks */}
          {Array.from({ length: 27 }, (_, i) => (
            <line
              key={i}
              x1={45 + i * 4.6}
              y1={170}
              x2={45 + i * 4.6}
              y2={i % 5 === 0 ? 182 : i % 2 === 0 ? 178 : 175}
              stroke="currentColor"
              strokeWidth={i % 5 === 0 ? 1.2 : 0.8}
              opacity={i % 5 === 0 ? 0.8 : 0.5}
            />
          ))}
          {/* Ruler loop */}
          <circle cx="178" cy="181" r="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      </div>

      <hr className="border-gray-200 mb-12" />

      {/* Instructions */}
      <div className="mb-12">
        <h2 className="font-semibold text-brand-dark text-xl mb-4">
          Descubra o tamanho do seu anel
        </h2>
        <ul className="space-y-2 list-disc pl-6 text-brand-gray text-sm leading-relaxed">
          <li>Usando uma régua meça o interior do anel (diâmetro) como mostra na imagem</li>
          <li>Compare a medida em cm com a tabela abaixo</li>
        </ul>
      </div>

      {/* Size table */}
      <table className="w-full max-w-lg mx-auto">
        <thead>
          <tr>
            <th className="text-left text-brand-dark font-semibold text-base pb-4 pl-4">
              Diâmetro (mm)
            </th>
            <th className="text-left text-brand-dark font-semibold text-base pb-4 pl-4">
              Medida
            </th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((row) => (
            <tr key={row.diameter} className="border-t border-gray-200">
              <td className="py-4 pl-4 text-sm text-brand-gray">{row.diameter}</td>
              <td className="py-4 pl-4 text-sm text-brand-dark font-medium">{row.size}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  )
}
