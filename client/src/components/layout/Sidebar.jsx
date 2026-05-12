import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  Package,
  Scissors,
  Truck,
  Calculator,
  GitMerge,
  BookOpen,
  FileText,
  Users,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/collections', icon: Layers,          label: 'Collections' },
  { to: '/workflows',   icon: GitMerge,        label: 'Workflows' },
  { to: '/fiches',      icon: BookOpen,        label: 'Fiches commerciales' },
  { divider: true },
  { to: '/materials',   icon: Scissors,        label: 'Matières' },
  { to: '/suppliers',   icon: Truck,           label: 'Fournisseurs' },
  { to: '/costing',     icon: Calculator,      label: 'Costing global' },
  { to: '/documents',   icon: FileText,        label: 'Documents' },
  { to: '/users',       icon: Users,           label: 'Utilisateurs' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-dark min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-xl text-white tracking-wide">PLM</span>
          <span className="text-white/30 text-xs tracking-widest uppercase">Fashion</span>
        </div>
        <div className="w-6 h-0.5 bg-gold mt-2" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item, i) =>
          item.divider ? (
            <div key={`divider-${i}`} className="my-2 border-t border-white/5" />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gold/15 text-gold'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="px-3 py-2 text-white/20 text-xs">v0.1.0</div>
      </div>
    </aside>
  )
}
