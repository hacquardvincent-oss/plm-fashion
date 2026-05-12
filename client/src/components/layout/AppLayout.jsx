import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/collections': 'Collections',
  '/products': 'Produits',
  '/materials': 'Matières',
  '/suppliers': 'Fournisseurs',
  '/costing': 'Costing',
  '/workflows': 'Workflows',
  '/documents': 'Documents',
  '/users': 'Utilisateurs',
}

function getTitle(pathname) {
  if (pathname.startsWith('/collections/')) return 'Détail collection'
  if (pathname.startsWith('/products/')) return 'Fiche technique produit'
  return PAGE_TITLES[pathname] ?? 'PLM Fashion'
}

export default function AppLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={getTitle(pathname)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
