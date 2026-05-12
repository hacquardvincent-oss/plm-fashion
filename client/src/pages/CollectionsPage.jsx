import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Layers } from 'lucide-react'
import { getCollections } from '../api/collections.api'
import CollectionCard from '../components/collections/CollectionCard'
import CollectionFormModal from '../components/collections/CollectionFormModal'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'

const STATUSES = [
  { value: '', label: 'Tous' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'validee', label: 'Validée' },
  { value: 'archivee', label: 'Archivée' },
]

const CAN_CREATE = ['admin', 'chef_produit', 'directeur_artistique']

export default function CollectionsPage() {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [search, setSearch] = useState('')

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections', filterStatus, filterYear],
    queryFn: () => getCollections({
      ...(filterStatus && { status: filterStatus }),
      ...(filterYear && { year: filterYear }),
    }),
  })

  const filtered = (collections ?? []).filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.season?.toLowerCase().includes(q)
    )
  })

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="input-field pl-9 py-2"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-white border border-dark/10 rounded-lg p-1">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterStatus === s.value
                  ? 'bg-gold text-white shadow-sm'
                  : 'text-dark/50 hover:text-dark hover:bg-dark/5'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Year filter */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="input-field w-auto py-2 pr-8"
        >
          <option value="">Toutes années</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Create button */}
        {CAN_CREATE.includes(user?.role) && (
          <button onClick={() => setModalOpen(true)} className="btn-primary ml-auto">
            <Plus size={15} />
            Nouvelle collection
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Aucune collection"
          description={search ? 'Aucun résultat pour cette recherche.' : 'Créez votre première collection pour commencer.'}
          action={
            CAN_CREATE.includes(user?.role) && !search ? (
              <button onClick={() => setModalOpen(true)} className="btn-primary">
                <Plus size={15} />
                Nouvelle collection
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-xs text-dark/40">
            {filtered.length} collection{filtered.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </div>
        </>
      )}

      <CollectionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        collection={null}
      />
    </div>
  )
}
