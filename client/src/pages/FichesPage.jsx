import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileText, ChevronRight, CheckCircle, Clock } from 'lucide-react'
import { getProducts } from '../api/products.api'
import { getFiche } from '../api/fiches.api'
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

export default function FichesPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  })

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h2 className="font-serif text-2xl text-dark">Fiches commerciales</h2>
        <p className="text-sm text-dark/40 mt-1">
          Générez les descriptifs wholesale et e-commerce (SEO / GEO FR + EN) pour chaque produit.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : !products?.length ? (
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
                  <td className="px-4 py-3">
                    <FicheStatusBadge productId={p.id} />
                  </td>
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
    </div>
  )
}
