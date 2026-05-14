import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileText, ChevronRight, CheckCircle, Clock, Zap, X, Check } from 'lucide-react'
import { getProducts } from '../api/products.api'
import { getCollections } from '../api/collections.api'
import { getFiche, batchGenerateFiches } from '../api/fiches.api'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

function FicheStatusBadge({ productId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['fiches', productId],
    queryFn: () => getFiche(productId),
    retry: false,
  })
  if (isLoading) return <span className="text-xs text-dark/30">…</span>
  if (!data) return (
    <span className="flex items-center gap-1 text-xs text-dark/30">
      <Clock size={11} /> Non générée
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs text-emerald-600">
      <CheckCircle size={11} /> v{data.version}
    </span>
  )
}

function BatchModal({ collections, onClose }) {
  const qc = useQueryClient()
  const [selectedCollection, setSelectedCollection] = useState('')
  const [results, setResults] = useState(null)

  const mutation = useMutation({
    mutationFn: () => batchGenerateFiches(selectedCollection),
    onSuccess: (data) => {
      setResults(data)
      qc.invalidateQueries({ queryKey: ['fiches'] })
    },
  })

  return (
    <div className="fixed inset-0 bg-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-dark/5">
          <h3 className="font-serif text-lg text-dark">Génération en masse</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {!results ? (
            <>
              <p className="text-sm text-dark/60 leading-relaxed">
                Génère les descriptifs commerciaux (Wholesale, E-commerce FR/EN + GEO) pour tous les produits actifs de la collection sélectionnée.
              </p>

              <div>
                <label className="label">Collection *</label>
                <select
                  className="input-field w-full mt-1"
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                >
                  <option value="">Choisir une collection…</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.season ?? ''}</option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 leading-relaxed">
                Les fiches existantes seront archivées et une nouvelle version sera créée pour chaque produit.
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="btn-ghost">Annuler</button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={!selectedCollection || mutation.isPending}
                  className="btn-primary"
                >
                  {mutation.isPending ? <><Spinner size="xs" /> Génération…</> : <><Zap size={14} /> Générer</>}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <Check size={24} className="text-emerald-600" />
                </div>
                <p className="font-medium text-dark">{results.generated} / {results.total} fiche{results.generated > 1 ? 's' : ''} générée{results.generated > 1 ? 's' : ''}</p>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {results.results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${r.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {r.status === 'ok' ? <Check size={11} /> : <X size={11} />}
                    <span className="font-medium">{r.productName ?? r.productId}</span>
                    {r.status === 'ok' && <span className="text-emerald-500">→ v{r.version}</span>}
                    {r.error && <span className="text-red-400 italic">{r.error}</span>}
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button onClick={onClose} className="btn-primary">Fermer</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FichesPage() {
  const [batchOpen, setBatchOpen] = useState(false)
  const [collectionFilter, setCollectionFilter] = useState('')

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  })
  const { data: collectionsData = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => getCollections(),
  })

  const allProducts = productsData?.products ?? productsData ?? []
  const collections = collectionsData?.collections ?? collectionsData ?? []

  const products = collectionFilter
    ? allProducts.filter((p) => p.collection_id === collectionFilter)
    : allProducts

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-dark">Fiches commerciales</h2>
          <p className="text-sm text-dark/40 mt-1">
            Descriptifs wholesale, e-commerce SEO/GEO (FR + EN) et données structurées schema.org.
          </p>
        </div>
        <button onClick={() => setBatchOpen(true)} className="btn-primary shrink-0">
          <Zap size={14} /> Générer par collection
        </button>
      </div>

      {/* Filtre collection */}
      <div className="flex gap-3 items-center">
        <select
          className="input-field w-auto min-w-[200px]"
          value={collectionFilter}
          onChange={(e) => setCollectionFilter(e.target.value)}
        >
          <option value="">Toutes les collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {collectionFilter && (
          <button onClick={() => setCollectionFilter('')} className="btn-ghost text-xs gap-1">
            <X size={12} /> Effacer
          </button>
        )}
        <span className="text-xs text-dark/30">{products.length} produit{products.length > 1 ? 's' : ''}</span>
      </div>

      {loadingProducts ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : !products.length ? (
        <div className="text-dark/40 text-sm">Aucun produit.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark/5">
                {['Référence', 'Produit', 'Collection', 'Statut', 'Fiche'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-dark/40 uppercase tracking-wider">{h}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/5">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-cream transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-dark/40">{p.reference}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-dark">{p.name}</td>
                  <td className="px-4 py-3 text-dark/50">{p.collection_name ?? '—'}</td>
                  <td className="px-4 py-3"><Badge status={p.status} /></td>
                  <td className="px-4 py-3"><FicheStatusBadge productId={p.id} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/fiches/${p.id}`}
                      className="flex items-center gap-1 text-xs text-gold hover:text-gold-dark font-medium ml-auto w-fit"
                    >
                      Ouvrir <ChevronRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {batchOpen && (
        <BatchModal
          collections={collections}
          onClose={() => setBatchOpen(false)}
        />
      )}
    </div>
  )
}
