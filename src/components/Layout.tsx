import { Menu } from 'lucide-react'
import { useState, type ReactNode } from 'react'
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
        <div className="mobile-bar">
          <button type="button" className="icon-button" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
            <span className="sr-only">Abrir menú</span>
          </button>
          <span>SupportAI</span>
        </div>
        <main>{children}</main>
      </div>
    </div>
  )
}
