import React from 'react'

type Item = { id: string; href: string; label: string }

const items: Item[] = [
  { id: 'nav-prices', href: '/admin/prices', label: 'Preços' },
  { id: 'nav-usage', href: '/admin/usage', label: 'Uso de recursos' },
]

export const NavExtras = () => {
  return (
    <div className="nav-group nav-extras" style={{ marginTop: 12 }}>
      {items.map((it) => (
        <a key={it.id} id={it.id} href={it.href} className="nav__link">
          <span className="nav__link-label">{it.label}</span>
        </a>
      ))}
    </div>
  )
}
