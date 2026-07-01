import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Percent, Package, XCircle, CheckCircle2,
  Coins, Layers, Info, ShoppingBag, Store, Globe, Building2,
  Undo2, Filter,
} from 'lucide-react'
import {
  getAnalyticsOverview, getAnalyticsProducts, getAnalyticsCollections,
  getCommercialOverview, getCommercialProducts, getCommercialCollections, getCommercialFunnel,
} from '../api/analytics.api'
import Spinner from '../components/ui/Spinner'
import { formatCurrency, PRODUCT_STATUS_STYLES, PRODUCT_STATUS_LABELS } from '../utils/status'

// ── Helpers ──────────────────────────────────────────────────────
const fmtInt = (n) => (n == null ? '—' : new Intl.NumberFormat('fr-FR').format(n))

function KpiCard({ icon: Icon, label, value, sub, color = 'gold' }) {
  const colors = {
    gold: 'bg-gold/10 text-gold', blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600', orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-500', purple: 'bg-purple-50 text-purple-600',
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

// ════════════════════════════════════════════════════════════════
//  ONGLET CONCEPTION (rentabilité prévisionnelle)
// ════════════════════════════════════════════════════════════════
function ConceptionTab() {
  const { data: overview, isLoading: lo } = useQuery({ queryKey: ['analytics', 'overview'], queryFn: getAnalyticsOverview })
  const { data: products, isLoading: lp } = useQuery({ queryKey: ['analytics', 'products'], queryFn: getAnalyticsProducts })
  const { data: collections } = useQuery({ queryKey: ['analytics', 'collections'], queryFn: getAnalyticsCollections })

  return (
    <div className="space-y-6">
      {lo ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Package} color="blue" label="Références" value={overview?.total ?? 0} sub={`${overview?.en_cours ?? 0} en cours`} />
          <KpiCard icon={Percent} color="green" label="Marge cible moyenne"
            value={overview?.avg_target_margin != null ? `${overview.avg_target_margin}%` : '—'}
            sub={overview?.avg_real_margin != null ? `${overview.avg_real_margin}% réelle (costing)` : 'costing à compléter'} />
          <KpiCard icon={Coins} color="gold" label="Coût de revient moyen"
            value={formatCurrency(overview?.avg_real_cost ?? overview?.avg_target_cost)}
            sub={overview?.avg_coefficient != null ? `coef. ×${overview.avg_coefficient}` : null} />
          <KpiCard icon={XCircle} color="red" label="Taux d'annulation"
            value={overview != null ? `${overview.cancellation_rate}%` : '—'} sub={`${overview?.abandonnes ?? 0} abandonné(s)`} />
        </div>
      )}

      {!lo && overview && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-base text-dark">Taux de transformation concept → validé</h3>
            <span className="text-sm font-semibold text-emerald-600">{overview.validation_rate}%</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-dark/5">
            <div className="bg-emerald-400" style={{ width: `${overview.validation_rate}%` }} />
            <div className="bg-blue-300" style={{ width: `${overview.total > 0 ? (overview.en_cours / overview.total) * 100 : 0}%` }} />
            <div className="bg-red-300" style={{ width: `${overview.total > 0 ? (overview.abandonnes / overview.total) * 100 : 0}%` }} />
          </div>
          <div className="flex gap-5 mt-3 text-xs text-dark/50">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> {overview.valides} validés</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-300" /> {overview.en_cours} en cours</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-300" /> {overview.abandonnes} abandonnés</span>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-dark/5">
          <Layers size={16} className="text-dark/40" />
          <h3 className="font-serif text-base text-dark">Rentabilité prévisionnelle par collection</h3>
        </div>
        {!collections || collections.length === 0 ? <div className="py-10 text-center text-dark/30 text-sm">Aucune donnée</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-dark/5">
              {['Collection', 'Réf.', 'Marge cible', 'Marge réelle', 'Coût moy.', 'Taux annul.'].map((h) => (
                <th key={h} className="text-left py-2.5 px-5 text-xs font-medium text-dark/40 uppercase tracking-wider">{h}</th>))}
            </tr></thead>
            <tbody className="divide-y divide-dark/5">
              {collections.map((c) => (
                <tr key={c.id} className="hover:bg-cream transition-colors">
                  <td className="py-3 px-5"><Link to={`/collections/${c.id}`} className="font-medium text-dark hover:text-gold transition-colors">{c.name}</Link><span className="text-xs text-dark/30 ml-2 font-mono">{c.code}</span></td>
                  <td className="py-3 px-5 text-dark/60">{c.total}</td>
                  <td className="py-3 px-5 text-dark/60">{c.avg_target_margin != null ? `${c.avg_target_margin}%` : '—'}</td>
                  <td className="py-3 px-5"><MarginBar value={c.avg_real_margin} /></td>
                  <td className="py-3 px-5 text-dark/60">{formatCurrency(c.avg_cost)}</td>
                  <td className="py-3 px-5"><span className={c.cancellation_rate > 25 ? 'text-red-500 font-medium' : 'text-dark/50'}>{c.cancellation_rate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark/5">
          <div className="flex items-center gap-2"><TrendingUp size={16} className="text-dark/40" /><h3 className="font-serif text-base text-dark">Rentabilité prévisionnelle par produit</h3></div>
          <span className="text-xs text-dark/30 flex items-center gap-1.5"><Info size={12} /> trié par marge décroissante</span>
        </div>
        {lp ? <div className="flex justify-center py-12"><Spinner /></div> : !products || products.length === 0 ? <div className="py-10 text-center text-dark/30 text-sm">Aucun produit</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-dark/5">
                {['Produit', 'Statut', 'Coût revient', 'Prix détail', 'Marge', 'Protos'].map((h) => (
                  <th key={h} className="text-left py-2.5 px-5 text-xs font-medium text-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>))}
              </tr></thead>
              <tbody className="divide-y divide-dark/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-cream transition-colors group">
                    <td className="py-3 px-5"><Link to={`/products/${p.id}`} className="font-medium text-dark group-hover:text-gold transition-colors">{p.name}</Link><div className="text-xs text-dark/30 font-mono">{p.reference}</div></td>
                    <td className="py-3 px-5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRODUCT_STATUS_STYLES[p.status] ?? 'bg-dark/5 text-dark/50'}`}>{PRODUCT_STATUS_LABELS[p.status] ?? p.status}</span></td>
                    <td className="py-3 px-5 text-dark/70 whitespace-nowrap">{formatCurrency(p.effective_cost)}</td>
                    <td className="py-3 px-5 text-dark/70 whitespace-nowrap">{formatCurrency(p.effective_retail)}</td>
                    <td className="py-3 px-5"><div className="flex items-center gap-2"><MarginBar value={p.effective_margin} />{p.is_estimated && p.effective_margin != null && (<span className="text-[9px] text-dark/30 uppercase" title="Estimé sur la marge cible">est.</span>)}</div></td>
                    <td className="py-3 px-5 text-dark/50 tabular-nums">{p.proto_count > 0 ? `${p.proto_count}×` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-dark/30 flex items-center gap-1.5"><CheckCircle2 size={12} />Marge réelle issue du costing finalisé · « est. » = projection sur la marge cible.</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  ONGLET COMMERCIAL (rentabilité réalisée — sell-in par canal)
// ════════════════════════════════════════════════════════════════
const CHANNEL_META = {
  retail: { label: 'Retail', icon: Store, color: 'bg-gold' },
  digital: { label: 'Digital', icon: Globe, color: 'bg-blue-400' },
  wholesale: { label: 'Wholesale', icon: Building2, color: 'bg-purple-400' },
}

function ChannelMixBar({ mix }) {
  const total = (mix?.retail || 0) + (mix?.digital || 0) + (mix?.wholesale || 0)
  if (total <= 0) return <span className="text-dark/30 text-xs">—</span>
  return (
    <div className="flex h-2 w-full rounded-full overflow-hidden bg-dark/5" title={`Retail ${formatCurrency(mix.retail)} · Digital ${formatCurrency(mix.digital)} · Wholesale ${formatCurrency(mix.wholesale)}`}>
      {['retail', 'digital', 'wholesale'].map((k) => (
        <div key={k} className={CHANNEL_META[k].color} style={{ width: `${(mix[k] / total) * 100}%` }} />
      ))}
    </div>
  )
}

function Funnel({ data }) {
  if (!data?.steps) return null
  const max = data.steps[0]?.value || 1
  return (
    <div className="space-y-2">
      {data.steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-3">
          <span className="text-xs text-dark/50 w-28 shrink-0">{s.label}</span>
          <div className="flex-1 h-7 bg-dark/5 rounded-lg overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-300 flex items-center px-2" style={{ width: `${Math.max(4, (s.value / max) * 100)}%` }}>
              <span className="text-xs font-medium text-white whitespace-nowrap">{fmtInt(s.value)}</span>
            </div>
          </div>
          <span className="text-xs text-dark/40 w-14 text-right tabular-nums">{i === 0 ? '' : `${s.rate}%`}</span>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs text-red-400 w-28 shrink-0 flex items-center gap-1"><Undo2 size={12} /> Retours</span>
        <div className="flex-1 text-xs text-dark/50">{fmtInt(data.returns)} unités retournées</div>
        <span className="text-xs text-red-500 font-medium w-14 text-right">{data.return_rate}%</span>
      </div>
    </div>
  )
}

function CommercialTab() {
  const { data: ov, isLoading: lo } = useQuery({ queryKey: ['commercial', 'overview'], queryFn: getCommercialOverview })
  const { data: products, isLoading: lp } = useQuery({ queryKey: ['commercial', 'products'], queryFn: getCommercialProducts })
  const { data: collections } = useQuery({ queryKey: ['commercial', 'collections'], queryFn: getCommercialCollections })
  const { data: funnel } = useQuery({ queryKey: ['commercial', 'funnel'], queryFn: getCommercialFunnel })

  const noData = !lo && (!ov || ov.ca_commande === 0)
  if (noData) {
    return (
      <div className="card p-10 text-center">
        <ShoppingBag size={28} className="text-dark/20 mx-auto mb-3" />
        <p className="text-dark/50 text-sm">Aucune donnée commerciale.</p>
        <p className="text-dark/30 text-xs mt-2">Lancer le seed <code className="bg-dark/5 px-1.5 py-0.5 rounded">seed:commercial</code> (GitHub Actions) pour charger les données de démo.</p>
      </div>
    )
  }

  const mixTotal = ov ? ov.mix.retail + ov.mix.digital + ov.mix.wholesale : 0

  return (
    <div className="space-y-6">
      {lo ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={ShoppingBag} color="gold" label="CA commandé" value={formatCurrency(ov.ca_commande)} sub={`${fmtInt(ov.qte_commandee)} unités`} />
          <KpiCard icon={Coins} color="blue" label="Coût total achat" value={formatCurrency(ov.cout_achat)} sub={`marge ${ov.marge_pct ?? '—'}%`} />
          <KpiCard icon={TrendingUp} color="green" label="Marge brute réalisée" value={formatCurrency(ov.marge_brute)} sub={`sur CA net ${formatCurrency(ov.ca_net)}`} />
          <KpiCard icon={Undo2} color="red" label="Retours" value={formatCurrency(ov.retours)} sub={`taux ${ov.taux_retour}%`} />
        </div>
      )}

      {/* Mix canal + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-serif text-base text-dark mb-4">Mix canal (CA commandé)</h3>
          {ov && mixTotal > 0 ? (
            <>
              <div className="flex h-4 rounded-full overflow-hidden bg-dark/5 mb-4">
                {['retail', 'digital', 'wholesale'].map((k) => (
                  <div key={k} className={CHANNEL_META[k].color} style={{ width: `${(ov.mix[k] / mixTotal) * 100}%` }} />
                ))}
              </div>
              <div className="space-y-2">
                {['retail', 'digital', 'wholesale'].map((k) => {
                  const M = CHANNEL_META[k]
                  return (
                    <div key={k} className="flex items-center gap-2 text-sm">
                      <span className={`w-2.5 h-2.5 rounded-full ${M.color}`} />
                      <M.icon size={13} className="text-dark/40" />
                      <span className="text-dark/60 flex-1">{M.label}</span>
                      <span className="text-dark font-medium">{formatCurrency(ov.mix[k])}</span>
                      <span className="text-dark/40 text-xs w-10 text-right">{((ov.mix[k] / mixTotal) * 100).toFixed(0)}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : <div className="text-dark/30 text-sm py-8 text-center">—</div>}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base text-dark">Funnel digital</h3>
            {funnel && <span className="text-xs text-dark/40">conv. globale {funnel.global_conversion}%</span>}
          </div>
          {funnel ? <Funnel data={funnel} /> : <div className="text-dark/30 text-sm py-8 text-center">—</div>}
        </div>
      </div>

      {/* P&L par collection */}
      <div className="card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-dark/5">
          <Layers size={16} className="text-dark/40" />
          <h3 className="font-serif text-base text-dark">Compte de résultat par collection</h3>
        </div>
        {!collections || collections.length === 0 ? <div className="py-10 text-center text-dark/30 text-sm">Aucune donnée</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-dark/5">
                {['Collection', 'CA commandé', 'Retours', 'CA net', 'Coût achat', 'Marge brute', 'Marge %', 'Tx retour'].map((h) => (
                  <th key={h} className="text-left py-2.5 px-5 text-xs font-medium text-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>))}
              </tr></thead>
              <tbody className="divide-y divide-dark/5">
                {collections.map((c) => (
                  <tr key={c.id} className="hover:bg-cream transition-colors">
                    <td className="py-3 px-5"><Link to={`/collections/${c.id}`} className="font-medium text-dark hover:text-gold transition-colors">{c.name}</Link><span className="text-xs text-dark/30 ml-2 font-mono">{c.code}</span></td>
                    <td className="py-3 px-5 text-dark/70 whitespace-nowrap">{formatCurrency(c.ca_commande)}</td>
                    <td className="py-3 px-5 text-red-400 whitespace-nowrap">−{formatCurrency(c.retours)}</td>
                    <td className="py-3 px-5 text-dark/70 whitespace-nowrap">{formatCurrency(c.ca_net)}</td>
                    <td className="py-3 px-5 text-dark/60 whitespace-nowrap">{formatCurrency(c.cout_achat)}</td>
                    <td className="py-3 px-5 font-semibold text-dark whitespace-nowrap">{formatCurrency(c.marge_brute)}</td>
                    <td className="py-3 px-5"><MarginBar value={c.marge_pct} /></td>
                    <td className="py-3 px-5"><span className={c.taux_retour > 20 ? 'text-red-500 font-medium' : 'text-dark/50'}>{c.taux_retour}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rentabilité réalisée par référence */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark/5">
          <div className="flex items-center gap-2"><TrendingUp size={16} className="text-dark/40" /><h3 className="font-serif text-base text-dark">Rentabilité réalisée par référence</h3></div>
          <span className="text-xs text-dark/30 flex items-center gap-1.5"><Info size={12} /> trié par marge €</span>
        </div>
        {lp ? <div className="flex justify-center py-12"><Spinner /></div> : !products || products.length === 0 ? <div className="py-10 text-center text-dark/30 text-sm">Aucune donnée</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-dark/5">
                {['Produit', 'Qté', 'CA commandé', 'Mix canal', 'PRI', 'Marge brute', 'Marge %', 'Tx retour'].map((h) => (
                  <th key={h} className="text-left py-2.5 px-5 text-xs font-medium text-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>))}
              </tr></thead>
              <tbody className="divide-y divide-dark/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-cream transition-colors group">
                    <td className="py-3 px-5"><Link to={`/products/${p.id}`} className="font-medium text-dark group-hover:text-gold transition-colors">{p.name}</Link><div className="text-xs text-dark/30 font-mono">{p.reference}</div></td>
                    <td className="py-3 px-5 text-dark/60 tabular-nums">{fmtInt(p.qte_commandee)}</td>
                    <td className="py-3 px-5 text-dark/70 whitespace-nowrap">{formatCurrency(p.ca_commande)}</td>
                    <td className="py-3 px-5 w-32"><ChannelMixBar mix={p.mix} /></td>
                    <td className="py-3 px-5 text-dark/60 whitespace-nowrap">{formatCurrency(p.pri)}</td>
                    <td className="py-3 px-5 font-medium text-dark whitespace-nowrap">{formatCurrency(p.marge_brute)}</td>
                    <td className="py-3 px-5"><MarginBar value={p.marge_pct} /></td>
                    <td className="py-3 px-5"><span className={p.taux_retour > 25 ? 'text-red-500 font-medium' : 'text-dark/50'}>{p.taux_retour}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-dark/30 flex items-center gap-1.5"><Filter size={12} />Données de démo (sell-in commandé) · à remplacer par le flux réel Cegid / NuOrder.</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
export default function AnalyticsPage() {
  const [tab, setTab] = useState('commercial')
  const TABS = [
    { id: 'commercial', label: 'Commercial', icon: ShoppingBag },
    { id: 'conception', label: 'Conception', icon: Package },
  ]
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-serif text-2xl text-dark">Performance &amp; rentabilité</h2>
        <p className="text-dark/40 text-sm mt-1">
          De la conception (marge prévisionnelle) au réalisé commercial (CA commandé, coûts, retours, funnel).
        </p>
      </div>

      <div className="flex gap-1 bg-white border border-dark/5 rounded-xl p-1 w-fit shadow-card">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-gold text-white shadow-sm' : 'text-dark/50 hover:text-dark hover:bg-dark/5'}`}>
            <Icon size={14} strokeWidth={1.75} /> {label}
          </button>
        ))}
      </div>

      {tab === 'commercial' ? <CommercialTab /> : <ConceptionTab />}
    </div>
  )
}
