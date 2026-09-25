import { Menu } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { currentAgent, productArea, productName } from '../config/product'
import type { PageId } from '../types/case'
import { Sidebar } from './Sidebar'

type LayoutProps = {
  currentPage: PageId
  onNavigate: (page: PageId) => void
  children: ReactNode
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      {menuOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
        />
      ) : null}
      <div className="app-main">
        <header className="app-header">
          <button type="button" className="icon-button mobile-only" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
            <span className="sr-only">Abrir menú</span>
          </button>
          <div>
            <p className="header-product">{productName}</p>
            <p className="header-area">{productArea}</p>
          </div>
          <div className="header-agent">
            <p>{currentAgent.name}</p>
            <p>{currentAgent.role}</p>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
