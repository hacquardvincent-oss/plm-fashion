import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Percent, Package, XCircle, CheckCircle2,
  Coins, Layers, ArrowRight, Info,
} from 'lucide-react'
import {
  getAnalyticsOverview, getAnalyticsProducts, getAnalyticsCollections,
} from '../api/analytics.api'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { formatCurrency, PRODUCT_STATUS_STYLES, PRODUCT_STATUS_LABELS } from '../utils/status'

function KpiCard({ icon: Icon, label, value, sub, color = 'gold' }) {
  const colors = {
    gold: 'bg-gold/10 text-gold',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-500',
  }
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <p className="text-2xl font-semibold text-dark leading-none">{value ?? '—'}</p>
      <p className="text-xs text-dark/50 mt-1.5">{label}</p>
      {sub && <p className="text-xs text-dark/30 mt-0.5">{sub}</p>}
    </div>
  )
}

function MarginBar({ value }) {
  if (value == null) return <span className="text-dark/30 text-xs">—</span>
  const pct = Math.max(0, Math.min(100, value))
  const color = value >= 60 ? 'bg-emerald-400' : value >= 45 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-dark/5 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-dark/70 tabular-nums">{value.toFixed(0)}%</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: overview, isLoading: lo } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: getAnalyticsOverview,
  })
  const { data: products, isLoading: lp } = useQuery({
    queryKey: ['analytics', 'products'],
    queryFn: getAnalyticsProducts,
  })
  const { data: collections } = useQuery({
    queryKey: ['analytics', 'collections'],
    queryFn: getAnalyticsCollections,
  })

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-serif text-2xl text-dark">Performance &amp; rentabilité</h2>
        <p className="text-dark/40 text-sm mt-1">
          Analyse basée sur les données de conception — marge cible, coût de revient et cycle de développement.
        </p>
      </div>

      {/* KPI globaux */}
      {lo ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Package} color="blue"
            label="Références" value={overview?.total ?? 0}
            sub={`${overview?.en_cours ?? 0} en cours`}
          />
          <KpiCard
            icon={Percent} color="green"
            label="Marge cible moyenne"
            value={overview?.avg_target_margin != null ? `${overview.avg_target_margin}%` : '—'}
            sub={overview?.avg_real_margin != null ? `${overview.avg_real_margin}% réelle (costing)` : 'costing à compléter'}
          />
          <KpiCard
            icon={Coins} color="gold"
            label="Coût de revient moyen"
            value={formatCurrency(overview?.avg_real_cost ?? overview?.avg_target_cost)}
            sub={overview?.avg_coefficient != null ? `coef. ×${overview.avg_coefficient}` : null}
          />
          <KpiCard
            icon={XCircle} color="red"
            label="Taux d'annulation"
            value={overview != null ? `${overview.cancellation_rate}%` : '—'}
            sub={`${overview?.abandonnes ?? 0} abandonné(s)`}
          />
        </div>
      )}

      {/* Taux de transformation */}
      {!lo && overview && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-base text-dark">Taux de transformation concept → validé</h3>
            <span className="text-sm font-semibold text-emerald-600">{overview.validation_rate}%</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-dark/5">
            <div className="bg-emerald-400" style={{ width: `${overview.validation_rate}%` }} title={`${overview.valides} validés`} />
            <div className="bg-blue-300" style={{ width: `${overview.total > 0 ? (overview.en_cours / overview.total) * 100 : 0}%` }} title={`${overview.en_cours} en cours`} />
            <div className="bg-red-300" style={{ width: `${overview.total > 0 ? (overview.abandonnes / overview.total) * 100 : 0}%` }} title={`${overview.abandonnes} abandonnés`} />
          </div>
          <div className="flex gap-5 mt-3 text-xs text-dark/50">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> {overview.valides} validés</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-300" /> {overview.en_cours} en cours</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-300" /> {overview.abandonnes} abandonnés</span>
          </div>
        </div>
      )}

      {/* Rentabilité par collection */}
      <div className="card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-dark/5">
          <Layers size={16} className="text-dark/40" />
          <h3 className="font-serif text-base text-dark">Rentabilité par collection</h3>
        </div>
        {!collections || collections.length === 0 ? (
          <div className="py-10 text-center text-dark/30 text-sm">Aucune donnée</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark/5">
                {['Collection', 'Réf.', 'Marge cible', 'Marge réelle', 'Coût moy.', 'Taux annul.'].map((h) => (
                  <th key={h} className="text-left py-2.5 px-5 text-xs font-medium text-dark/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/5">
              {collections.map((c) => (
                <tr key={c.id} className="hover:bg-cream transition-colors">
                  <td className="py-3 px-5">
                    <Link to={`/collections/${c.id}`} className="font-medium text-dark hover:text-gold transition-colors">{c.name}</Link>
                    <span className="text-xs text-dark/30 ml-2 font-mono">{c.code}</span>
                  </td>
                  <td className="py-3 px-5 text-dark/60">{c.total}</td>
                  <td className="py-3 px-5 text-dark/60">{c.avg_target_margin != null ? `${c.avg_target_margin}%` : '—'}</td>
                  <td className="py-3 px-5"><MarginBar value={c.avg_real_margin} /></td>
                  <td className="py-3 px-5 text-dark/60">{formatCurrency(c.avg_cost)}</td>
                  <td className="py-3 px-5">
                    <span className={c.cancellation_rate > 25 ? 'text-red-500 font-medium' : 'text-dark/50'}>
                      {c.cancellation_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rentabilité par produit */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark/5">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-dark/40" />
            <h3 className="font-serif text-base text-dark">Rentabilité par produit</h3>
          </div>
          <span className="text-xs text-dark/30 flex items-center gap-1.5">
            <Info size={12} /> trié par marge décroissante
          </span>
        </div>
        {lp ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !products || products.length === 0 ? (
          <div className="py-10 text-center text-dark/30 text-sm">Aucun produit</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark/5">
                  {['Produit', 'Statut', 'Coût revient', 'Prix détail', 'Marge', 'Protos'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-5 text-xs font-medium text-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-cream transition-colors group">
                    <td className="py-3 px-5">
                      <Link to={`/products/${p.id}`} className="font-medium text-dark group-hover:text-gold transition-colors">{p.name}</Link>
                      <div className="text-xs text-dark/30 font-mono">{p.reference}</div>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRODUCT_STATUS_STYLES[p.status] ?? 'bg-dark/5 text-dark/50'}`}>
                        {PRODUCT_STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-dark/70 whitespace-nowrap">{formatCurrency(p.effective_cost)}</td>
                    <td className="py-3 px-5 text-dark/70 whitespace-nowrap">{formatCurrency(p.effective_retail)}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <MarginBar value={p.effective_margin} />
                        {p.is_estimated && p.effective_margin != null && (
                          <span className="text-[9px] text-dark/30 uppercase" title="Estimé sur la marge cible, costing non finalisé">est.</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-dark/50 tabular-nums">{p.proto_count > 0 ? `${p.proto_count}×` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-dark/30 flex items-center gap-1.5">
        <CheckCircle2 size={12} />
        Marge réelle issue du costing finalisé · « est. » = projection sur la marge cible · données de vente réelles à venir (Cegid / NuOrder).
      </p>
    </div>
  )
}
