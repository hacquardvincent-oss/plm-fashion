import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Package, Tag, Palette, Ruler,
  FileText, Calculator, GitMerge, Scissors,
} from 'lucide-react'
import { getProduct } from '../api/products.api'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { formatCurrency, formatDate, PRODUCT_TYPE_LABELS } from '../utils/status'

const TABS = [
  { id: 'fiche', label: 'Fiche', icon: FileText },
  { id: 'bom', label: 'BOM', icon: Scissors },
  { id: 'variantes', label: 'Variantes', icon: Palette },
  { id: 'costing', label: 'Costing', icon: Calculator },
  { id: 'workflows', label: 'Workflows', icon: GitMerge },
]

function TabFiche({ product }) {
  const fields = [
    { label: 'Référence', value: product.reference },
    { label: 'Type', value: PRODUCT_TYPE_LABELS[product.type] ?? product.type },
    { label: 'Genre', value: product.gender ?? '—' },
    { label: 'Famille', value: product.family ?? '—' },
    { label: 'Sous-famille', value: product.sub_family ?? '—' },
    { label: 'Fournisseur principal', value: product.main_supplier_name ?? '—' },
    { label: 'Code ERP', value: product.erp_article_code ?? '—' },
    { label: 'Prix cible détail', value: formatCurrency(product.target_retail_price) },
    { label: 'Coût cible', value: formatCurrency(product.target_cost) },
    { label: 'Marge cible', value: product.target_margin ? `${product.target_margin}%` : '—' },
    { label: 'Créé par', value: product.created_by_name ?? '—' },
    { label: 'Créé le', value: formatDate(product.created_at) },
  ]

  return (
    <div className="space-y-6">
      {product.description && (
        <div>
          <p className="label">Description</p>
          <p className="text-sm text-dark/70 leading-relaxed">{product.description}</p>
        </div>
      )}
      {product.style_notes && (
        <div>
          <p className="label">Notes de style</p>
          <p className="text-sm text-dark/70 leading-relaxed">{product.style_notes}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex justify-between py-2 border-b border-dark/5">
            <span className="text-xs text-dark/40 uppercase tracking-wider">{label}</span>
            <span className="text-sm text-dark font-medium text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabBOM({ bom }) {
  if (!bom?.length) {
    return (
      <div className="py-12 text-center text-dark/30 text-sm">
        Aucune matière dans la nomenclature
      </div>
    )
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-dark/5">
          {['Matière', 'Usage', 'Quantité', 'Unité', 'Perte', 'Fournisseur'].map((h) => (
            <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-dark/40 uppercase tracking-wider">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-dark/5">
        {bom.map((line) => (
          <tr key={line.id} className="hover:bg-cream transition-colors">
            <td className="py-3 px-3 font-medium text-dark">{line.material_name ?? line.material_id}</td>
            <td className="py-3 px-3 text-dark/60">{line.usage_type ?? '—'}</td>
            <td className="py-3 px-3 text-dark/70">{line.quantity}</td>
            <td className="py-3 px-3 text-dark/50">{line.unit}</td>
            <td className="py-3 px-3 text-dark/50">
              {line.waste_factor ? `${(line.waste_factor * 100).toFixed(0)}%` : '—'}
            </td>
            <td className="py-3 px-3 text-dark/50">{line.supplier_name ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TabVariantes({ variants }) {
  if (!variants?.length) {
    return (
      <div className="py-12 text-center text-dark/30 text-sm">
        Aucune variante enregistrée
      </div>
    )
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-dark/5">
          {['SKU', 'Coloris', 'Référence couleur', 'Taille', 'Code-barres'].map((h) => (
            <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-dark/40 uppercase tracking-wider">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-dark/5">
        {variants.map((v) => (
          <tr key={v.id} className="hover:bg-cream transition-colors">
            <td className="py-3 px-3 font-mono text-xs text-dark/60">{v.sku}</td>
            <td className="py-3 px-3">
              <div className="flex items-center gap-2">
                {v.color_ref && (
                  <span
                    className="w-4 h-4 rounded-full border border-dark/10 shrink-0"
                    style={{ backgroundColor: v.color_ref.startsWith('#') ? v.color_ref : undefined }}
                  />
                )}
                <span className="text-dark/70">{v.color_name ?? '—'}</span>
              </div>
            </td>
            <td className="py-3 px-3 font-mono text-xs text-dark/40">{v.color_ref ?? '—'}</td>
            <td className="py-3 px-3 text-dark/70">{v.size ?? '—'}</td>
            <td className="py-3 px-3 font-mono text-xs text-dark/40">{v.barcode ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TabCosting({ costings }) {
  const current = costings?.find((c) => c.is_current) ?? costings?.[0]
  if (!current) {
    return (
      <div className="py-12 text-center text-dark/30 text-sm">
        Aucun costing disponible
      </div>
    )
  }
  const rows = [
    { label: 'Matières', value: current.materials_cost },
    { label: 'Façon / CMT', value: current.cmt_cost },
    { label: 'Accessoires', value: current.accessories_cost },
    { label: 'Transport', value: current.transport_cost },
    { label: 'Droits de douane', value: current.customs_cost },
  ]
  return (
    <div className="space-y-6 max-w-md">
      <div className="space-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-dark/5">
            <span className="text-sm text-dark/60">{label}</span>
            <span className="text-sm font-medium text-dark">{formatCurrency(value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between py-2 bg-gold-subtle rounded-lg px-3 mt-2">
          <span className="text-sm font-semibold text-dark">Coût total</span>
          <span className="text-sm font-semibold text-gold">{formatCurrency(current.total_cost)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="card p-4 text-center">
          <p className="text-lg font-semibold text-dark">{formatCurrency(current.wholesale_price)}</p>
          <p className="text-xs text-dark/40 mt-1">Prix gros</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-lg font-semibold text-dark">{formatCurrency(current.retail_price)}</p>
          <p className="text-xs text-dark/40 mt-1">Prix détail</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-lg font-semibold text-emerald-600">
            {current.gross_margin_pct ? `${current.gross_margin_pct}%` : '—'}
          </p>
          <p className="text-xs text-dark/40 mt-1">Marge brute</p>
        </div>
      </div>
    </div>
  )
}

function TabWorkflows({ workflows }) {
  if (!workflows?.length) {
    return (
      <div className="py-12 text-center text-dark/30 text-sm">
        Aucun workflow de validation
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {workflows.map((w) => (
        <div key={w.id} className="card p-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-dark">{w.stage}</span>
              <Badge status={w.decision} label={w.decision} />
            </div>
            <p className="text-xs text-dark/40">
              Demandé par {w.requested_by_name ?? '—'} · {formatDate(w.requested_at)}
            </p>
          </div>
          {w.due_date && (
            <span className="text-xs text-dark/40 shrink-0">
              Échéance : {formatDate(w.due_date)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const [tab, setTab] = useState('fiche')

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!product) {
    return <div className="text-dark/40">Produit introuvable.</div>
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back */}
      {product.collection_id && (
        <Link to={`/collections/${product.collection_id}`} className="btn-ghost -ml-1 w-fit text-dark/50">
          <ArrowLeft size={14} />
          Collection
        </Link>
      )}

      {/* Product header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <Package size={22} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs text-dark/30 uppercase tracking-wider">
                {product.reference}
              </span>
              <Badge status={product.status} />
              {product.type && (
                <span className="text-xs text-dark/30">
                  {PRODUCT_TYPE_LABELS[product.type]}
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl text-dark">{product.name}</h2>
            {product.collection_name && (
              <p className="text-sm text-dark/40 mt-0.5">{product.collection_name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 bg-white border border-dark/5 rounded-xl p-1 w-fit shadow-card">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button
              key={tid}
              onClick={() => setTab(tid)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === tid
                  ? 'bg-gold text-white shadow-sm'
                  : 'text-dark/50 hover:text-dark hover:bg-dark/5'
              }`}
            >
              <Icon size={14} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        <div className="card p-6 mt-3">
          {tab === 'fiche' && <TabFiche product={product} />}
          {tab === 'bom' && <TabBOM bom={product.bom} />}
          {tab === 'variantes' && <TabVariantes variants={product.variants} />}
          {tab === 'costing' && <TabCosting costings={product.costings} />}
          {tab === 'workflows' && <TabWorkflows workflows={product.workflows} />}
        </div>
      </div>
    </div>
  )
}
