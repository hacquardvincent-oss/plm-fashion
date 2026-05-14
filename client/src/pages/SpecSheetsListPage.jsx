import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ClipboardList, ChevronRight, Filter } from 'lucide-react'
import { getProducts } from '../api/products.api'
import { getCollections } from '../api/collections.api'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { PRODUCT_TYPE_LABELS } from '../utils/status'

const STATUS_ORDER = ['concept', 'en_developpement', 'proto_1', 'proto_2', 'sms', 'valide', 'abandonne', 'archive']

export default function SpecSheetsListPage() {
  const [search, setSearch] = useState('')
  const [collectionFilter, setCollectionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  })

  const { data: collectionsData = [], isLoading: loadingCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: () => getCollections(),
  })

  const collections = collectionsData?.collections ?? collectionsData ?? []

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (products?.products ?? products ?? []).filter((p) => {
      const matchSearch = !q ||
        p.reference?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q)
      const matchCollection = !collectionFilter || p.collection_id === collectionFilter
      const matchStatus = !statusFilter || p.status === statusFilter
      return matchSearch && matchCollection && matchStatus
    })
  }, [products, search, collectionFilter, statusFilter])

  const isLoading = loadingProducts || loadingCollections

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="page-title">Fiches techniques</h1>
        <p className="text-sm text-dark/40 mt-1">
          Accédez et éditez les fiches techniques structurées de chaque référence.
        </p>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
          <input
            className="input-field pl-9"
            placeholder="Rechercher par référence ou nom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <select
          className="input-field w-auto min-w-[180px]"
          value={collectionFilter}
          onChange={(e) => setCollectionFilter(e.target.value)}
        >
          <option value="">Toutes les collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className="input-field w-auto min-w-[160px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Compteur */}
      {!isLoading && (
        <p className="text-sm text-dark/40">
          {filtered.length} référence{filtered.length > 1 ? 's' : ''}
          {search && ` pour "${search}"`}
        </p>
      )}

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList size={32} className="mx-auto text-dark/15 mb-3" />
          <p className="text-dark/40 text-sm">
            {search ? `Aucun résultat pour "${search}"` : 'Aucune référence trouvée'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="btn-ghost mt-3 text-xs">
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-dark/5">
          {filtered.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}/spec-sheet`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-cream/60 transition-colors group"
            >
              {/* Icône */}
              <div className="w-9 h-9 rounded-lg bg-gold/8 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors">
                <ClipboardList size={16} className="text-gold" />
              </div>

              {/* Référence + Nom */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs text-dark/35 uppercase tracking-wider">{product.reference}</span>
                  <Badge status={product.status} />
                </div>
                <p className="font-medium text-dark text-sm truncate">{product.name}</p>
                {product.collection_name && (
                  <p className="text-xs text-dark/35 mt-0.5">{product.collection_name}</p>
                )}
              </div>

              {/* Type */}
              <span className="text-xs text-dark/30 hidden sm:block shrink-0">
                {PRODUCT_TYPE_LABELS[product.type] ?? product.type}
              </span>

              {/* Arrow */}
              <ChevronRight size={16} className="text-dark/20 group-hover:text-gold transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
