import React from 'react'
import type { AdminViewServerProps } from 'payload'
import './Dashboard.scss'

type CardItem = {
  slug: string
  label: string
  description: string
  action: string
  href: string
  createHref?: string
  icon: React.ReactNode
}

// ── Icons ──
const mediaIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 3H3C1.9 3 1 3.9 1 5v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 15.5c0 .28-.22.5-.5.5h-17c-.28 0-.5-.22-.5-.5V5.5c0-.28.22-.5.5-.5h17c.28 0 .5.22.5.5v13zM5 17l3.5-4.5 2.5 3.01L14.5 11l4.5 6H5z" />
  </svg>
)
const categoriesIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 19h20L12 2z" />
    <circle cx="12" cy="9" r="1.5" fill="white" />
  </svg>
)
const colorsIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
)
const productsIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
  </svg>
)
const pagesIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM9 13h6v2H9v-2zm0-3h6v2H9v-2zm0 6h4v2H9v-2z" />
  </svg>
)
const settingsIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
)
const homeIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
  </svg>
)
const footerIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-4h16v4z" />
  </svg>
)

const collectionItems: CardItem[] = [
  {
    slug: 'media',
    label: 'Media',
    description: 'Gere imagens e ficheiros do catálogo, organizadas por produto.',
    action: 'EXPLORAR FICHEIROS',
    href: '/admin/collections/media',
    createHref: '/admin/collections/media/create',
    icon: mediaIcon,
  },
  {
    slug: 'categories',
    label: 'Categorias',
    description: 'Organiza a estrutura do catálogo por categorias e secções.',
    action: 'DEFINIR ESTRUTURA',
    href: '/admin/collections/categories',
    createHref: '/admin/collections/categories/create',
    icon: categoriesIcon,
  },
  {
    slug: 'colors',
    label: 'Cores',
    description: 'Biblioteca global de cores reutilizáveis em todos os produtos.',
    action: 'GERIR PALETA',
    href: '/admin/collections/colors',
    createHref: '/admin/collections/colors/create',
    icon: colorsIcon,
  },
  {
    slug: 'products',
    label: 'Produtos',
    description: 'Catálogo completo da loja, com variantes, preços e imagens.',
    action: 'GERIR INVENTÁRIO',
    href: '/admin/collections/products',
    createHref: '/admin/collections/products/create',
    icon: productsIcon,
  },
  {
    slug: 'pages',
    label: 'Páginas',
    description: 'Cria e edita páginas estáticas como sobre, guias e termos.',
    action: 'EDITAR LAYOUTS',
    href: '/admin/collections/pages',
    createHref: '/admin/collections/pages/create',
    icon: pagesIcon,
  },
]

const globalItems: CardItem[] = [
  {
    slug: 'site-settings',
    label: 'Definições',
    description: 'Configurações gerais do site: logo, redes sociais, contactos.',
    action: 'ABRIR DEFINIÇÕES',
    href: '/admin/globals/site-settings',
    icon: settingsIcon,
  },
  {
    slug: 'home-settings',
    label: 'Homepage',
    description: 'Conteúdo da página inicial: hero, secções e blocos.',
    action: 'EDITAR HOMEPAGE',
    href: '/admin/globals/home-settings',
    icon: homeIcon,
  },
  {
    slug: 'footer-settings',
    label: 'Rodapé',
    description: 'Conteúdo, colunas e links do rodapé do site.',
    action: 'EDITAR RODAPÉ',
    href: '/admin/globals/footer-settings',
    icon: footerIcon,
  },
]

function Card({ item, index }: { item: CardItem; index: number }) {
  const number = String(index + 1).padStart(2, '0')
  return (
    <a href={item.href} className="custom-dashboard__card">
      <div className="custom-dashboard__card-top">
        <span className="custom-dashboard__card-icon">{item.icon}</span>
        <span className="custom-dashboard__card-number">{number}</span>
      </div>
      <h3 className="custom-dashboard__card-title">{item.label}</h3>
      <p className="custom-dashboard__card-desc">{item.description}</p>
      <span className="custom-dashboard__card-action">
        {item.action}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  )
}

export const Dashboard: React.FC<AdminViewServerProps> = async () => {
  let counter = 0
  return (
    <div className="custom-dashboard">
      <div className="custom-dashboard__header">
        <h1 className="custom-dashboard__title">COLEÇÕES</h1>
        <p className="custom-dashboard__subtitle">GESTÃO DE INVENTÁRIO</p>
      </div>
      <div className="custom-dashboard__grid">
        {collectionItems.map((item) => (
          <Card key={item.slug} item={item} index={counter++} />
        ))}
      </div>

      <div className="custom-dashboard__header" style={{ marginTop: 48 }}>
        <h1 className="custom-dashboard__title">CONFIGURAÇÃO</h1>
        <p className="custom-dashboard__subtitle">SITE, HOMEPAGE E RODAPÉ</p>
      </div>
      <div className="custom-dashboard__grid">
        {globalItems.map((item) => (
          <Card key={item.slug} item={item} index={counter++} />
        ))}
      </div>
    </div>
  )
}
