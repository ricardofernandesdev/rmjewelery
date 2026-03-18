# RM Jewelry — Catálogo Digital

## What This Is

Portfólio digital de uma marca de joias em aço inoxidável. Um site elegante e minimalista onde consumidores finais podem explorar a coleção completa, organizada por categorias e coleções temáticas, e entrar em contacto via Instagram. Inclui painel administrativo completo para gestão de todo o conteúdo.

## Core Value

O cliente consegue navegar pela coleção de joias de forma visual e apelativa, sentindo a identidade da marca, e contactar facilmente via Instagram quando se interessa por uma peça.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Catálogo de produtos com fotos, nome e descrição (sem preço)
- [ ] Organização por categorias (Anéis, Colares, Pulseiras, Brincos, etc.)
- [ ] Organização por coleções temáticas
- [ ] Botão "Estou interessado" com ícone Instagram que redireciona para DMs
- [ ] Páginas dinâmicas editáveis (guia de limpeza, guia de tamanhos, about us, etc.)
- [ ] Sistema de posicionamento de páginas no menu (header e/ou footer)
- [ ] Homepage com banners e produtos em destaque
- [ ] Painel admin: CRUD de produtos com upload de múltiplas fotos
- [ ] Painel admin: gestão de categorias e coleções
- [ ] Painel admin: gestão de banners e destaques da homepage
- [ ] Painel admin: criação e edição de páginas dinâmicas com rich text editor
- [ ] Painel admin: dashboard com estatísticas de visualizações e produtos mais vistos
- [ ] API REST para comunicação frontend-backend
- [ ] Design minimalista/luxo (clean, espaço branco, tipografia elegante)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- E-commerce / carrinho de compras — não é uma loja online, é um portfólio
- Sistema de pagamentos — sem transações, contacto é feito via Instagram
- Autenticação de utilizadores (público) — visitantes não precisam de conta
- Preços visíveis no catálogo — decisão de marca, preços dados via DM
- App mobile nativa — web-first, responsivo é suficiente
- Multi-idioma — foco no mercado português inicialmente
- Notificações push — sem necessidade para um portfólio

## Context

- Marca de joias em aço inoxidável focada no mercado consumidor final
- O Instagram é o canal principal de comunicação e vendas
- O site serve como portfólio/vitrine digital da marca — extensão da presença no Instagram
- Conteúdo gerido por admin único (dono da marca)
- Páginas extra são dinâmicas: o admin cria páginas com editor e posiciona nos menus (header/footer)

## Constraints

- **Design**: Minimalista e luxuoso — tipografia elegante, muito espaço branco, foco nas fotos
- **Sem e-commerce**: Nenhuma funcionalidade de compra ou pagamento
- **Contacto via Instagram**: Único canal de contacto — botão redireciona para DMs do Instagram
- **Responsivo**: Deve funcionar bem em mobile (maioria do tráfego vem do Instagram)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sem preços no catálogo | Estratégia de marca — preços dados via DM do Instagram | — Pending |
| Páginas dinâmicas com posicionamento | Flexibilidade para criar páginas sem deploy, escolhendo menu header/footer | — Pending |
| Instagram como canal de contacto | Canal principal da marca, sem necessidade de formulários | — Pending |
| Stack a definir na pesquisa | Deixar a fase de research recomendar a melhor stack | — Pending |

---
*Last updated: 2026-03-18 after initialization*
