// client/src/pages/PurchasesPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, Plus, AlertTriangle, Clock, CheckCircle, Package, TrendingUp } from 'lucide-react'
import { getPurchases, getPurchaseStats } from '../api/purchases.api'
import Spinner from '../components/ui/Spinner'

const STATUS_LABELS = {
  draft: { label: 'Brouillon', color: 'bg-dark/5 text-dark/50' },
  sent: { label: 'Envoyé', color: 'bg-blue-50 text-blue-600' },
  confirmed: { label: 'Confirmé', color: 'bg-amber-50 text-amber-600' },
  in_production: { label: 'En production', color: 'bg-purple-50 text-purple-600' },
  shipped: { label: 'Expédié', color: 'bg-indigo-50 text-indigo-600' },
  partially_received: { label: 'Partiel', color: 'bg-orange-50 text-orange-600' },
  received: { label: 'Reçu', color: 'bg-emerald-50 text-emerald-600' },
  validated: { label: 'Validé', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Annulé', color: 'bg-red-50 text-red-400' },
}

const ALERT_CONFIG = {
  late: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
  due_soon: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  ok: { icon: null, color: '', bg: '' },
}

function StatCard({ icon: Icon, label, value, color = 'text-dark' }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-gold" />
        </div>
        <div>
          <p className="text-xs text-dark/40 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-serif font-medium mt-0.5 ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function PurchasesPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data: purchases = [], isLoading: loadingPO } = useQuery({
    queryKey: ['purchases'],
    queryFn: getPurchases,
  })

  const { data: stats } = useQuery({
    queryKey: ['purchase-stats'],
    queryFn: getPurchaseStats,
  })

  const filtered = purchases.filter(po => {
    if (filter === 'active' && ['validated','cancelled'].includes(po.status)) return false
    if (filter === 'late' && po.delivery_alert !== 'late') return false
    if (filter === 'due_soon' && po.delivery_alert !== 'due_soon') return false
    if (search && !po.reference.toLowerCase().includes(search.toLowerCase()) &&
        !po.supplier_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const fmt = (n) => n ? Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' €' : '—'

  if (loadingPO) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-dark">Achats matières & fournitures</h1>
          <p className="text-sm text-dark/40 mt-0.5">Suivi des bons de commande fournisseurs</p>
        </div>
        <Link to="/purchases/new" className="btn-primary">
          <Plus size={14} /> Nouveau BC
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={ShoppingCart} label="BC en cours" value={stats.open_orders ?? 0} />
          <StatCard icon={AlertTriangle} label="En retard" value={stats.late_orders ?? 0} color="text-red-600" />
          <StatCard icon={Clock} label="À livrer cette semaine" value={stats.due_this_week ?? 0} color="text-amber-600" />
          <StatCard icon={TrendingUp} label="Budget engagé" value={fmt(stats.total_engaged)} />
        </div>
      )}

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white border border-dark/5 rounded-xl p-1 shadow-card">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'active', label: 'En cours' },
            { key: 'late', label: '🔴 En retard' },
            { key: 'due_soon', label: '🟡 Cette semaine' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter === key ? 'bg-gold text-white shadow-sm' : 'text-dark/50 hover:text-dark hover:bg-dark/5'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <input
          placeholder="Rechercher ref. ou fournisseur…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1 min-w-48"
        />
      </div>

      {/* Liste des BC */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-dark/30 text-sm">
          {search || filter !== 'all' ? 'Aucun résultat' : 'Aucun bon de commande — créez le premier'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(po => {
            const statusCfg = STATUS_LABELS[po.status] || STATUS_LABELS.draft
            const alertCfg = ALERT_CONFIG[po.delivery_alert] || ALERT_CONFIG.ok
            return (
              <div key={po.id} onClick={() => navigate(`/purchases/${po.id}`)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/purchases/${po.id}`)}
                className={`card p-4 flex items-center gap-4 hover:border-dark/10 transition-colors group cursor-pointer ${
                  alertCfg.bg ? `border ${alertCfg.bg}` : ''
                }`}>
                <div className="w-10 h-10 rounded-xl bg-dark/5 flex items-center justify-center shrink-0">
                  <Package size={16} className="text-dark/30" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-dark">{po.reference}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                    {po.nc_count > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                        {po.nc_count} NC
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-dark/60 mt-0.5">
                    {po.supplier_name || '—'}
                    {po.collection_name && <span className="text-dark/30"> · {po.collection_name}</span>}
                  </p>
                </div>

                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-sm font-medium text-dark">
                    {po.total_amount ? Number(po.total_amount).toLocaleString('fr-FR') + ' €' : '—'}
                  </p>
                  <p className="text-xs text-dark/40">{po.lines_count} ligne{po.lines_count !== 1 ? 's' : ''}</p>
                </div>

                <div className="text-right shrink-0 hidden md:block">
                  <p className="text-xs text-dark/40 uppercase tracking-wider">Livraison prévue</p>
                  <p className={`text-sm font-medium mt-0.5 ${
                    po.delivery_alert === 'late' ? 'text-red-600' :
                    po.delivery_alert === 'due_soon' ? 'text-amber-600' : 'text-dark'
                  }`}>
                    {po.expected_delivery
                      ? new Date(po.expected_delivery).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
