import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Plus, Search, Pencil, Package,
  CalendarDays, DollarSign, Target,
} from 'lucide-react'
import { getCollection } from '../api/collections.api'
import { getProducts } from '../api/products.api'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import CollectionFormModal from '../components/collections/CollectionFormModal'
import { formatCurrency, formatDate, PRODUCT_STATUS_LABELS } from '../utils/status'
import { useAuth } from '../hooks/useAuth'

const CAN_EDIT = ['admin', 'chef_produit', 'directeur_artistique']

export default function CollectionDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: collection, isLoading } = useQuery({
    queryKey: ['collections', id],
    queryFn: () => getCollection(id),
  })

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', { collection_id: id }],
    queryFn: () => getProducts({ collection_id: id }),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!collection) {
    return <div className="text-dark/40">Collection introuvable.</div>
  }

  const filtered = (products ?? []).filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.reference?.toLowerCase().includes(q) ||
      p.family?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link to="/collections" className="btn-ghost -ml-1 w-fit text-dark/50">
        <ArrowLeft size={14} />
        Collections
      </Link>

      {/* Collection header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs text-dark/30 uppercase tracking-wider">
                {collection.code}
              </span>
              <Badge status={collection.status} />
            </div>
            <h2 className="font-serif text-2xl text-dark mb-1">{collection.name}</h2>
            <p className="text-dark/50 text-sm">{collection.season} {collection.year}</p>
            {collection.description && (
              <p className="text-dark/40 text-sm mt-3 max-w-xl">{collection.description}</p>
            )}
          </div>

          {CAN_EDIT.includes(user?.role) && (
            <button onClick={() => setEditOpen(true)} className="btn-secondary shrink-0">
              <Pencil size={14} />
              Modifier
            </button>
          )}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-dark/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
              <Package size={14} className="text-gold" />
            </div>
            <div>
              <p className="text-base font-semibold text-dark">{products?.length ?? 0}</p>
              <p className="text-xs text-dark/40">
                {collection.target_refs ? `/ ${collection.target_refs} cible` : 'références'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <DollarSign size={14} className="text-blue-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-dark">
                {formatCurrency(collection.budget)}
              </p>
              <p className="text-xs text-dark/40">Budget</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CalendarDays size={14} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-dark">{formatDate(collection.delivery_date)}</p>
              <p className="text-xs text-dark/40">Livraison</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Target size={14} className="text-purple-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-dark">{formatDate(collection.showroom_date)}</p>
              <p className="text-xs text-dark/40">Showroom</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-serif text-lg text-dark">Références produits</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="input-field pl-8 py-1.5 w-48"
              />
            </div>
            {CAN_EDIT.includes(user?.role) && (
              <button className="btn-primary">
                <Plus size={14} />
                Nouveau produit
              </button>
            )}
          </div>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun produit"
            description="Cette collection ne contient pas encore de références."
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark/5">
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark/40 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark/40 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark/40 uppercase tracking-wider hidden md:table-cell">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark/40 uppercase tracking-wider hidden sm:table-cell">
                    Famille
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark/40 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-dark/40 uppercase tracking-wider hidden lg:table-cell">
                    Prix cible
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/5">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-cream transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/products/${p.id}`}
                        className="font-mono text-xs text-dark/40 hover:text-gold transition-colors"
                      >
                        {p.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/products/${p.id}`}
                        className="font-medium text-dark hover:text-gold transition-colors"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-dark/50 capitalize">
                        {p.type?.replace('_', '-') ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-dark/50">
                      {p.family ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-dark/70 hidden lg:table-cell">
                      {p.target_retail_price
                        ? formatCurrency(p.target_retail_price)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CollectionFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        collection={collection}
      />
    </div>
  )
}
