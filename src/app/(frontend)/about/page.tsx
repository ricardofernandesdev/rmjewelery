import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Sobre Nós | RM Jewelry',
}

export default function AboutPage() {
  return (
    <Container className="py-16 md:py-24 max-w-3xl mx-auto">
      <h1 className="font-heading italic text-4xl md:text-5xl text-brand-dark text-center mb-12">
        Sobre nós
      </h1>

      <hr className="border-gray-200 mb-12" />

      <div className="space-y-10 text-brand-gray text-base leading-relaxed">
        <div>
          <h2 className="font-semibold text-brand-dark text-lg mb-3">
            Bem-vindo à R&M Jewelry!
          </h2>
          <p>
            Na nossa loja, acreditamos que cada joia tem o poder de destacar a sua personalidade e
            completar qualquer look, do dia a dia a ocasiões especiais. Por isso, selecionamos
            cuidadosamente peças em aço inoxidável de alta qualidade, resistentes, hipoalergénicas e com
            acabamento impecável.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-brand-dark text-lg mb-3">
            A Nossa Missão
          </h2>
          <p>
            A nossa missão é oferecer joias elegantes, duráveis e versáteis, que acompanhem todos os
            estilos e ocasiões. Queremos que cada cliente se sinta confiante e único com as nossas peças,
            sem complicações e com toda a praticidade de comprar online.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-brand-dark text-lg mb-3">
            Compromisso com a Qualidade
          </h2>
          <p>
            Cada peça disponível na nossa loja é escolhida para garantir resistência, brilho duradouro e
            conforto. Se alguma peça apresentar defeito, oferecemos a substituição gratuita, porque a sua
            satisfação é a nossa prioridade.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-brand-dark text-lg mb-3">
            Descubra a Nossa Coleção
          </h2>
          <p>
            Explore os nossos anéis, colares, pulseiras, brincos e conjuntos e encontre a peça perfeita para si
            ou para oferecer a alguém especial. Estamos aqui para tornar cada momento ainda mais
            memorável com joias que combinam beleza, estilo e durabilidade.
          </p>
        </div>
      </div>
    </Container>
  )
}
