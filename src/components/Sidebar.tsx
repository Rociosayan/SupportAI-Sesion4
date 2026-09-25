import {
  ClipboardList,
  FileText,
  FlaskConical,
  History,
  Home,
  Package,
  Users,
  X,
} from 'lucide-react'
import { currentAgent, productArea, productName } from '../config/product'
import type { PageId } from '../types/case'

type SidebarProps = {
  currentPage: PageId
  onNavigate: (page: PageId) => void
  open: boolean
  onClose: () => void
}

const groups: { label: string; links: { id: PageId; label: string; icon: typeof Home }[] }[] = [
  {
    label: 'Operación',
    links: [
      { id: 'inicio', label: 'Inicio', icon: Home },
      { id: 'casos', label: 'Casos', icon: ClipboardList },
      { id: 'clientes', label: 'Clientes', icon: Users },
      { id: 'pedidos', label: 'Pedidos', icon: Package },
    ],
  },
  {
    label: 'Conocimiento',
    links: [
      { id: 'documentos', label: 'Conocimiento', icon: FileText },
      { id: 'historial', label: 'Historial', icon: History },
    ],
  },
  {
    label: 'Laboratorio',
    links: [{ id: 'laboratorio', label: 'Laboratorio LLM', icon: FlaskConical }],
  },
]

export function Sidebar({ currentPage, onNavigate, open, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`}>
      <div className="brand">
        <div>
          <p className="brand-mark">{productName}</p>
          <p className="brand-sub">{productArea}</p>
        </div>
        <button type="button" className="icon-button mobile-only" onClick={onClose}>
          <X size={20} />
          <span className="sr-only">Cerrar menú</span>
        </button>
      </div>
      <nav>
        {groups.map((group) => (
          <div key={group.label} className="nav-group">
            <p className="nav-group-label">{group.label}</p>
            {group.links.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.id}
                  type="button"
                  className={currentPage === link.id ? 'nav-link is-active' : 'nav-link'}
                  onClick={() => {
                    onNavigate(link.id)
                    onClose()
                  }}
                >
                  <Icon size={18} />
                  {link.label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-agent">
        <p>{currentAgent.name}</p>
        <p>{currentAgent.role}</p>
      </div>
    </aside>
  )
}
