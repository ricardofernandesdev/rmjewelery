import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Guia para cuidar das suas joias | RM Jewelry',
}

export default function CareGuidePage() {
  return (
    <Container className="py-16 md:py-24 max-w-3xl mx-auto">
      <h1 className="font-heading italic text-4xl md:text-5xl text-brand-dark text-center mb-12">
        Guia para cuidar das suas joias
      </h1>

      <hr className="border-gray-200 mb-12" />

      <div className="space-y-8 text-brand-gray text-base leading-relaxed">
        <p>
          Para garantir que as suas joias em aço inoxidável se mantêm sempre brilhantes e com aspeto
          novo, é importante seguir alguns cuidados simples no dia a dia. Estes passos ajudam a
          preservar a durabilidade, o conforto e o acabamento impecável de cada peça.
        </p>

        <ul className="space-y-5 list-disc pl-6">
          <li>
            Deve limpar as peças sempre que as notar mais sujas (use apenas água quente e um pano
            macio).
          </li>
          <li>
            Evite contacto directo com sprays, perfumes, cremes, detergentes e outros produtos que
            possam conter químicos.
          </li>
          <li>
            Evite contacto com água salgada ou água que contenha desinfetantes como o cloro.
          </li>
          <li>
            Guarde as jóias em pequenas caixas ou sacos (preferencialmente de tecido macio) de forma
            individual para que não fiquem riscadas.
          </li>
          <li>
            Protejas os dourados e rose gold pois estes levando um banho de cor, são mais suscetíveis a
            ficarem baços e sem brilho.
          </li>
        </ul>

        <p>
          Se ainda tiver alguma dúvida sobre como cuidar das suas joias, estamos sempre disponíveis
          para ajudar. Envie-nos uma mensagem e a nossa equipa terá todo o gosto em esclarecer tudo.
        </p>
      </div>
    </Container>
  )
}
