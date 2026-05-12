import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Layers, Package, GitMerge, Truck, ArrowRight, TrendingUp } from 'lucide-react'
import { getCollections } from '../api/collections.api'
import { getProducts } from '../api/products.api'
import { getWorkflows } from '../api/workflows.api'
import { getSuppliers } from '../api/suppliers.api'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { formatDate, COLLECTION_STATUS_BAR } from '../utils/status'
import { useAuth } from '../hooks/useAuth'

function StatCard({ icon: Icon, label, value, sub, color = 'gold' }) {
  const colors = {
    gold: 'bg-gold/10 text-gold',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-dark leading-none">{value ?? '—'}</p>
        <p className="text-xs text-dark/50 mt-1">{label}</p>
        {sub && <p className="text-xs text-dark/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: collections, isLoading: loadingCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: () => getCollections(),
  })

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  })

  const { data: workflows } = useQuery({
    queryKey: ['workflows', 'en_attente'],
    queryFn: () => getWorkflows({ decision: 'en_attente' }),
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers(),
  })

  const activeCollections = collections?.filter((c) => c.status === 'en_cours') ?? []
  const recentCollections = collections?.slice(0, 5) ?? []

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Greeting */}
      <div>
        <h2 className="font-serif text-2xl text-dark">
          {greeting()}, {user?.first_name} 👋
        </h2>
        <p className="text-dark/40 text-sm mt-1">
          {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Layers}
          label="Collections actives"
          value={loadingCollections ? '…' : activeCollections.length}
          sub={`${collections?.length ?? 0} au total`}
          color="gold"
        />
        <StatCard
          icon={Package}
          label="Références produits"
          value={loadingProducts ? '…' : (products?.length ?? 0)}
          color="blue"
        />
        <StatCard
          icon={GitMerge}
          label="Validations en attente"
          value={workflows?.length ?? 0}
          color="orange"
        />
        <StatCard
          icon={Truck}
          label="Fournisseurs actifs"
          value={suppliers?.filter((s) => s.is_active)?.length ?? 0}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent collections */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark/5">
            <h3 className="font-serif text-base text-dark">Collections récentes</h3>
            <Link to="/collections" className="text-xs text-gold hover:text-gold-dark flex items-center gap-1 transition-colors">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>

          {loadingCollections ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : recentCollections.length === 0 ? (
            <div className="py-12 text-center text-dark/30 text-sm">
              Aucune collection
            </div>
          ) : (
            <div className="divide-y divide-dark/5">
              {recentCollections.map((c) => (
                <Link
                  key={c.id}
                  to={`/collections/${c.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-cream transition-colors group"
                >
                  <div className={`w-1 h-8 rounded-full shrink-0 ${COLLECTION_STATUS_BAR[c.status]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-dark/30">{c.code}</span>
                      <Badge status={c.status} />
                    </div>
                    <p className="text-sm font-medium text-dark truncate group-hover:text-gold transition-colors">
                      {c.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-dark/50">{c.product_count ?? 0} réf.</p>
                    <p className="text-xs text-dark/30">{c.year}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending workflows */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark/5">
            <h3 className="font-serif text-base text-dark">Validations</h3>
            <span className="text-xs text-dark/40">en attente</span>
          </div>

          {!workflows || workflows.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className="text-sm text-dark/40">Tout est à jour</p>
            </div>
          ) : (
            <div className="divide-y divide-dark/5">
              {workflows.slice(0, 6).map((w) => (
                <div key={w.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-dark truncate">{w.product_name ?? 'Produit'}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-dark/40">{w.stage}</span>
                    {w.due_date && (
                      <span className="text-xs text-orange-500">{formatDate(w.due_date)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
