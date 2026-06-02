import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Calculator, ChevronRight, AlertCircle } from 'lucide-react'
import { getCollections } from '../api/collections.api'
import { getProducts } from '../api/products.api'
import { getCosting } from '../api/costing.api'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'

const fmt = (n) =>
  n != null && n !== '' ? `${parseFloat(n).toFixed(2)} €` : '—'

function totalCost(c) {
  if (!c) return null
  return (
    parseFloat(c.materials_cost || 0) +
    parseFloat(c.cmt_cost || 0) +
    parseFloat(c.accessories_cost || 0) +
    parseFloat(c.transport_cost || 0) +
    parseFloat(c.customs_cost || 0)
  )
}

function marginPct(cost, wsPrice) {
  if (!cost || !wsPrice || parseFloat(wsPrice) === 0) return null
  return ((parseFloat(wsPrice) - cost) / parseFloat(wsPrice)) * 100
}

function MarginBadge({ pct }) {
  if (pct === null) return <span className="text-dark/30">—</span>
  const color = pct >= 50 ? 'text-emerald-600' : pct >= 30 ? 'text-amber-500' : 'text-red-500'
  return <span className={`font-semibold ${color}`}>{pct.toFixed(0)} %</span>
}

export default function CostingPage() {
  const navigate = useNavigate()
  const [collectionId, setCollectionId] = useState('')

  const { data: collections } = useQuery({
    queryKey: ['collections'],
    queryFn: () => getCollections(),
  })

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', collectionId],
    queryFn: () => getProducts({ ...(collectionId && { collection_id: collectionId }) }),
  })

  const costingQueries = useQueries({
    queries: (products ?? []).map(p => ({
      queryKey: ['costing', p.id],
      queryFn: () => getCosting(p.id),
      retry: false,
      enabled: !loadingProducts,
    })),
  })

  const rows = (products ?? []).map((p, i) => ({
    ...p,
    costing: costingQueries[i]?.data ?? null,
    costingLoading: costingQueries[i]?.isLoading ?? false,
  }))

  const costedRows = rows.filter(r => r.costing)
  const totalMat = costedRows.reduce((sum, r) => sum + parseFloat(r.costing.materials_cost || 0), 0)
  const avgWs = costedRows.length > 0
    ? costedRows.reduce((sum, r) => sum + parseFloat(r.costing.wholesale_price || 0), 0) / costedRows.length
    : 0
  const avgMargin = costedRows.length > 0
    ? costedRows.reduce((sum, r) => {
        const c = totalCost(r.costing)
        const m = marginPct(c, r.costing.wholesale_price)
        return sum + (m ?? 0)
      }, 0) / costedRows.length
    : null

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Collection</label>
          <select value={collectionId} onChange={e => setCollectionId(e.target.value)} className="input-field w-auto py-2 pr-10">
            <option value="">Toutes les collections</option>
            {(collections ?? []).map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.season ? ` — ${c.season}` : ''}{c.year ? ` ${c.year}` : ''}</option>
            ))}
          </select>
        </div>
        {costedRows.length > 0 && (
          <div className="flex gap-3 ml-auto">
            <div className="bg-white border border-dark/10 rounded-xl px-4 py-3 text-center min-w-[110px]">
              <div className="text-xs text-dark/40 mb-0.5">Produits costés</div>
              <div className="font-semibold text-dark">{costedRows.length} / {rows.length}</div>
            </div>
            <div className="bg-white border border-dark/10 rounded-xl px-4 py-3 text-center min-w-[130px]">
              <div className="text-xs text-dark/40 mb-0.5">Coût matières total</div>
              <div className="font-semibold text-dark">{totalMat.toFixed(2)} €</div>
            </div>
            <div className="bg-white border border-dark/10 rounded-xl px-4 py-3 text-center min-w-[130px]">
              <div className="text-xs text-dark/40 mb-0.5">PV wholesale moyen</div>
              <div className="font-semibold text-dark">{avgWs.toFixed(2)} €</div>
            </div>
            {avgMargin !== null && (
              <div className="bg-white border border-dark/10 rounded-xl px-4 py-3 text-center min-w-[110px]">
                <div className="text-xs text-dark/40 mb-0.5">Marge moyenne</div>
                <div className={`font-semibold ${avgMargin >= 50 ? 'text-emerald-600' : avgMargin >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
                  {avgMargin.toFixed(0)} %
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loadingProducts ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Calculator} title="Aucun produit"
          description={collectionId ? 'Cette collection ne contient pas encore de produits.' : 'Sélectionnez une collection ou créez des produits pour saisir leur costing.'} />
      ) : (
        <div className="bg-white rounded-xl border border-dark/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dark/10">
              <tr>
                {['Réf.', 'Produit', 'Statut', 'Coût matières', 'CMT', 'Coût total', 'PV wholesale', 'PV retail', 'Marge', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/5">
              {rows.map(r => {
                const cost = totalCost(r.costing)
                const mg = marginPct(cost, r.costing?.wholesale_price)
                return (
                  <tr key={r.id} className="hover:bg-cream/50 transition-colors cursor-pointer group" onClick={() => navigate(`/products/${r.id}`)}>
                    <td className="px-4 py-3 font-mono text-xs text-dark/50 whitespace-nowrap">{r.reference || r.code || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-dark">{r.name}</div>
                      {r.category && <div className="text-xs text-dark/40 mt-0.5">{r.category}</div>}
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-dark/5 rounded-full text-xs capitalize whitespace-nowrap">{r.status || '—'}</span></td>
                    {r.costingLoading ? (
                      <td colSpan={6} className="px-4 py-3"><Spinner size="sm" /></td>
                    ) : r.costing ? (
                      <>
                        <td className="px-4 py-3 text-dark/70 whitespace-nowrap">{fmt(r.costing.materials_cost)}</td>
                        <td className="px-4 py-3 text-dark/70 whitespace-nowrap">{fmt(r.costing.cmt_cost)}</td>
                        <td className="px-4 py-3 font-semibold text-dark whitespace-nowrap">{cost != null ? `${cost.toFixed(2)} €` : '—'}</td>
                        <td className="px-4 py-3 text-dark/70 whitespace-nowrap">{fmt(r.costing.wholesale_price)}</td>
                        <td className="px-4 py-3 text-dark/70 whitespace-nowrap">{fmt(r.costing.retail_price)}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><MarginBadge pct={mg} /></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3" colSpan={5}>
                          <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium"><AlertCircle size={12} />Costing à saisir</span>
                        </td>
                        <td className="px-4 py-3" />
                      </>
                    )}
                    <td className="px-4 py-3 text-dark/20 group-hover:text-dark/50 transition-colors"><ChevronRight size={14} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {costedRows.length < rows.length && (
            <div className="px-4 py-3 border-t border-dark/5 text-xs text-dark/40">
              {rows.length - costedRows.length} produit{rows.length - costedRows.length > 1 ? 's' : ''} sans costing — cliquez sur la ligne pour saisir.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
