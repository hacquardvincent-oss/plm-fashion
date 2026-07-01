import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Package, FileText, Calculator,
  GitMerge, Scissors, Palette, Plus, Trash2, Pencil, Send, ClipboardList, History, ChevronRight, Check,
} from 'lucide-react'
import { getProduct, createProductVersion, updateProductVersion, addVersionBomLine, deleteVersionBomLine } from '../api/products.api'
import { deleteBomLine } from '../api/products.api'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import ProductFormModal from '../components/products/ProductFormModal'
import BomFormModal from '../components/products/BomFormModal'
import VariantFormModal from '../components/products/VariantFormModal'
import CostingForm from '../components/products/CostingForm'
import WorkflowFormModal from '../components/workflows/WorkflowFormModal'
import ReturnInsightsPanel from '../components/returns/ReturnInsightsPanel'
import { decideWorkflow } from '../api/workflows.api'
import { formatCurrency, formatDate, PRODUCT_TYPE_LABELS } from '../utils/status'
import { useAuth } from '../hooks/useAuth'

const TABS = [
  { id: 'versions', label: 'Versions', icon: History },
  { id: 'fiche', label: 'Fiche', icon: FileText },
  { id: 'bom', label: 'BOM', icon: Scissors },
  { id: 'variantes', label: 'Variantes', icon: Palette },
  { id: 'costing', label: 'Costing', icon: Calculator },
  { id: 'workflows', label: 'Workflows', icon: GitMerge },
]

const VERSION_STATUS_LABELS = {
  concept: 'Concept', proto_1: 'Proto 1', proto_2: 'Proto 2',
  sms: 'SMS', valide: 'Validé', abandonne: 'Abandonné',
}
const VERSION_STATUS_STYLES = {
  concept: 'bg-gray-100 text-gray-600',
  proto_1: 'bg-blue-100 text-blue-700',
  proto_2: 'bg-indigo-100 text-indigo-700',
  sms: 'bg-orange-100 text-orange-700',
  valide: 'bg-emerald-100 text-emerald-700',
  abandonne: 'bg-red-100 text-red-600',
}

function NewVersionModal({ open, onClose, productId, versions }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ label: '', status: 'proto_1', proto_size: '', coloris: '', notes: '', copy_bom: true })
  const mutation = useMutation({
    mutationFn: (data) => createProductVersion(productId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', productId] }); onClose() },
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-serif text-xl text-dark">Nouvelle version</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Label</label>
            <input className="input" placeholder={`Proto ${(versions?.length ?? 0) + 1}`} value={form.label} onChange={set('label')} />
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="input" value={form.status} onChange={set('status')}>
              {Object.entries(VERSION_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Taille proto</label>
              <input className="input" placeholder="ex: 36" value={form.proto_size} onChange={set('proto_size')} />
            </div>
            <div>
              <label className="label">Coloris</label>
              <input className="input" placeholder="ex: NAVY" value={form.coloris} onChange={set('coloris')} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
          </div>
          <label className="flex items-center gap-2 text-sm text-dark/70 cursor-pointer">
            <input type="checkbox" checked={form.copy_bom} onChange={set('copy_bom')} className="rounded" />
            Copier le BOM de la version précédente
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={() => mutation.mutate({ label: form.label || undefined, status: form.status, proto_size: form.proto_size || null, coloris: form.coloris || null, notes: form.notes || null })}
            disabled={mutation.isPending}
            className="btn-primary flex-1"
          >Créer</button>
        </div>
      </div>
    </div>
  )
}

function TabVersions({ product }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [selectedId, setSelectedId] = useState(null)
  const [newOpen, setNewOpen] = useState(false)
  const versions = product.versions ?? []
  const selected = selectedId ? versions.find((v) => v.id === selectedId) : versions.find((v) => v.is_current) ?? versions[versions.length - 1]

  const statusMutation = useMutation({
    mutationFn: ({ versionId, status }) => updateProductVersion(product.id, versionId, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', product.id] }),
  })

  if (versions.length === 0) {
    return (
      <div className="py-12 text-center text-dark/30 text-sm space-y-3">
        <p>Aucune version enregistrée</p>
        {CAN_EDIT.includes(user?.role) && (
          <button onClick={() => setNewOpen(true)} className="btn-primary mx-auto">
            <Plus size={14} /> Créer la première version
          </button>
        )}
        <NewVersionModal open={newOpen} onClose={() => setNewOpen(false)} productId={product.id} versions={versions} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Timeline */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {versions.map((v, i) => (
          <div key={v.id} className="flex items-center">
            <button
              onClick={() => setSelectedId(v.id)}
              className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all min-w-[90px] border ${
                (selected?.id === v.id)
                  ? 'border-gold bg-gold/5'
                  : 'border-transparent hover:bg-cream'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                v.status === 'valide' ? 'bg-emerald-100 text-emerald-700' :
                v.is_current ? 'bg-gold text-white' : 'bg-dark/10 text-dark/50'
              }`}>
                {v.status === 'valide' ? <Check size={14} /> : `V${v.version_number}`}
              </div>
              <span className="text-[10px] font-medium text-dark/70 leading-tight text-center">{v.label}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full mt-1 font-medium ${VERSION_STATUS_STYLES[v.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {VERSION_STATUS_LABELS[v.status] ?? v.status}
              </span>
            </button>
            {i < versions.length - 1 && <ChevronRight size={14} className="text-dark/20 shrink-0 mx-0.5" />}
          </div>
        ))}
        {CAN_EDIT.includes(user?.role) && (
          <button onClick={() => setNewOpen(true)} className="ml-2 shrink-0 w-8 h-8 rounded-full border-2 border-dashed border-dark/20 hover:border-gold text-dark/30 hover:text-gold flex items-center justify-center transition-colors">
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Selected version detail */}
      {selected && (
        <div className="border border-dark/5 rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-dark">{selected.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERSION_STATUS_STYLES[selected.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {VERSION_STATUS_LABELS[selected.status] ?? selected.status}
                </span>
                {selected.is_current && <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold font-medium">Actuelle</span>}
              </div>
              <div className="flex gap-4 mt-1 text-xs text-dark/40">
                {selected.proto_size && <span>Taille: {selected.proto_size}</span>}
                {selected.coloris && <span>Coloris: {selected.coloris}</span>}
                {selected.created_by_name && <span>par {selected.created_by_name}</span>}
              </div>
              {selected.notes && <p className="text-xs text-dark/50 mt-1 italic">{selected.notes}</p>}
            </div>
            {CAN_EDIT.includes(user?.role) && selected.status !== 'valide' && selected.status !== 'abandonne' && (
              <div className="flex gap-2 shrink-0">
                {selected.status !== 'sms' && (
                  <button
                    onClick={() => statusMutation.mutate({ versionId: selected.id, status: 'sms' })}
                    disabled={statusMutation.isPending}
                    className="px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-medium rounded-lg hover:bg-orange-100 transition-colors"
                  >→ SMS</button>
                )}
                <button
                  onClick={() => statusMutation.mutate({ versionId: selected.id, status: 'valide' })}
                  disabled={statusMutation.isPending}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                >✓ Valider</button>
              </div>
            )}
          </div>

          {/* Version BOM */}
          <div>
            <p className="text-xs font-medium text-dark/40 uppercase tracking-wider mb-2">Nomenclature ({selected.bom_count ?? 0} matière{selected.bom_count !== 1 ? 's' : ''})</p>
            <p className="text-xs text-dark/30 italic">Ouvrir la version pour éditer le BOM détaillé.</p>
          </div>
        </div>
      )}

      <NewVersionModal open={newOpen} onClose={() => setNewOpen(false)} productId={product.id} versions={versions} />
    </div>
  )
}

const CAN_EDIT = ['admin', 'chef_produit', 'directeur_artistique']
const CAN_DECIDE = ['admin', 'chef_produit', 'direction', 'qualite']

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
      <ReturnInsightsPanel type={product.type} family={product.family} subFamily={product.sub_family} compact />
      {product.description && (
        <div>
          <p className="label">Description</p>
          <p className="text-sm text-dark/70 leading-relaxed">{product.description}</p>
        </div>
      )}
      {product.style_notes && (
        <div>
          <p className="label">Notes de style</p>
          <p className="text-sm text-dark/70 leading-relaxed italic">{product.style_notes}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-8">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex justify-between py-2.5 border-b border-dark/5">
            <span className="text-xs text-dark/40 uppercase tracking-wider">{label}</span>
            <span className="text-sm text-dark font-medium text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabBOM({ product }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [addOpen, setAddOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: (bomId) => deleteBomLine(product.id, bomId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', product.id] }),
  })

  const bom = product.bom ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-dark/50">{bom.length} matière{bom.length > 1 ? 's' : ''}</p>
        {CAN_EDIT.includes(user?.role) && (
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus size={14} /> Ajouter une matière
          </button>
        )}
      </div>

      {bom.length === 0 ? (
        <div className="py-12 text-center text-dark/30 text-sm">
          Aucune matière dans la nomenclature
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark/5">
              {['Matière', 'Usage', 'Qté', 'Unité', 'Perte', ''].map((h) => (
                <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-dark/40 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark/5">
            {bom.map((line) => (
              <tr key={line.id} className="hover:bg-cream transition-colors group">
                <td className="py-3 px-3 font-medium text-dark">{line.material_name ?? '—'}</td>
                <td className="py-3 px-3 text-dark/60">{line.usage_type ?? '—'}</td>
                <td className="py-3 px-3 text-dark/70">{line.quantity}</td>
                <td className="py-3 px-3 text-dark/50">{line.unit}</td>
                <td className="py-3 px-3 text-dark/50">
                  {line.waste_factor ? `${(line.waste_factor * 100).toFixed(0)}%` : '—'}
                </td>
                <td className="py-3 px-3 text-right">
                  {CAN_EDIT.includes(user?.role) && (
                    <button
                      onClick={() => deleteMutation.mutate(line.id)}
                      disabled={deleteMutation.isPending}
                      className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <BomFormModal open={addOpen} onClose={() => setAddOpen(false)} productId={product.id} />
    </div>
  )
}

function TabVariantes({ product }) {
  const { user } = useAuth()
  const [addOpen, setAddOpen] = useState(false)
  const variants = product.variants ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-dark/50">{variants.length} variante{variants.length > 1 ? 's' : ''}</p>
        {CAN_EDIT.includes(user?.role) && (
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus size={14} /> Ajouter une variante
          </button>
        )}
      </div>

      {variants.length === 0 ? (
        <div className="py-12 text-center text-dark/30 text-sm">Aucune variante enregistrée</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark/5">
              {['SKU', 'Coloris', 'Réf. couleur', 'Taille', 'Système', 'Code-barres'].map((h) => (
                <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-dark/40 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark/5">
            {variants.map((v) => (
              <tr key={v.id} className="hover:bg-cream transition-colors">
                <td className="py-3 px-3 font-mono text-xs text-dark/60">{v.sku}</td>
                <td className="py-3 px-3 text-dark/70">{v.color_name ?? '—'}</td>
                <td className="py-3 px-3 font-mono text-xs text-dark/40">{v.color_ref ?? '—'}</td>
                <td className="py-3 px-3 text-dark/70">{v.size ?? '—'}</td>
                <td className="py-3 px-3 text-dark/50">{v.size_system ?? '—'}</td>
                <td className="py-3 px-3 font-mono text-xs text-dark/40">{v.barcode ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <VariantFormModal open={addOpen} onClose={() => setAddOpen(false)} productId={product.id} />
    </div>
  )
}

function TabCosting({ product }) {
  const current = product.costings?.find((c) => c.is_current) ?? product.costings?.[0]
  return <CostingForm productId={product.id} current={current} />
}

function TabWorkflows({ product }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [addOpen, setAddOpen] = useState(false)
  const workflows = product.workflows ?? []

  const decideMutation = useMutation({
    mutationFn: ({ id, decision }) => decideWorkflow(id, { decision }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', product.id] }),
  })

  const DECISION_STYLES = {
    en_attente: 'bg-amber-50 text-amber-700',
    approuve: 'bg-emerald-50 text-emerald-700',
    rejete: 'bg-red-50 text-red-600',
    revision: 'bg-blue-50 text-blue-700',
  }
  const DECISION_LABELS = { en_attente: 'En attente', approuve: 'Approuvé', rejete: 'Rejeté', revision: 'Révision' }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-dark/50">{workflows.length} workflow{workflows.length > 1 ? 's' : ''}</p>
        <button onClick={() => setAddOpen(true)} className="btn-primary">
          <Send size={14} /> Demander une validation
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="py-12 text-center text-dark/30 text-sm">Aucun workflow de validation</div>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => (
            <div key={w.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-dark capitalize">{w.stage?.replace('_', ' ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DECISION_STYLES[w.decision] ?? 'bg-dark/5 text-dark/50'}`}>
                      {DECISION_LABELS[w.decision] ?? w.decision}
                    </span>
                  </div>
                  <p className="text-xs text-dark/40">
                    Demandé par {w.requested_by_name ?? '—'} · {formatDate(w.requested_at)}
                  </p>
                  {w.comments && (
                    <p className="text-xs text-dark/50 mt-2 italic">"{w.comments}"</p>
                  )}
                </div>
                {w.decision === 'en_attente' && CAN_DECIDE.includes(user?.role) && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => decideMutation.mutate({ id: w.id, decision: 'approuve' })}
                      disabled={decideMutation.isPending}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => decideMutation.mutate({ id: w.id, decision: 'rejete' })}
                      disabled={decideMutation.isPending}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <WorkflowFormModal open={addOpen} onClose={() => setAddOpen(false)} productId={product.id} />
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [tab, setTab] = useState('versions')
  const [editOpen, setEditOpen] = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
  })

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (!product) return <div className="text-dark/40">Produit introuvable.</div>

  return (
    <div className="space-y-5 max-w-4xl">
      <Link to={product.collection_id ? `/collections/${product.collection_id}` : '/collections'}
        className="btn-ghost -ml-1 w-fit text-dark/50">
        <ArrowLeft size={14} /> Collection
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <Package size={22} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs text-dark/30 uppercase tracking-wider">{product.reference}</span>
              <Badge status={product.status} />
              {product.type && <span className="text-xs text-dark/30">{PRODUCT_TYPE_LABELS[product.type]}</span>}
            </div>
            <h2 className="font-serif text-2xl text-dark">{product.name}</h2>
            {product.collection_name && <p className="text-sm text-dark/40 mt-0.5">{product.collection_name}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to={`/products/${id}/spec-sheet`} className="btn-secondary flex items-center gap-2">
              <ClipboardList size={14} /> Fiche technique
            </Link>
            {CAN_EDIT.includes(user?.role) && (
              <button onClick={() => setEditOpen(true)} className="btn-secondary">
                <Pencil size={14} /> Modifier
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 bg-white border border-dark/5 rounded-xl p-1 w-fit shadow-card overflow-x-auto">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button key={tid} onClick={() => setTab(tid)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === tid ? 'bg-gold text-white shadow-sm' : 'text-dark/50 hover:text-dark hover:bg-dark/5'
              }`}>
              <Icon size={14} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        <div className="card p-6 mt-3">
          {tab === 'fiche' && <TabFiche product={product} />}
          {tab === 'bom' && <TabBOM product={product} />}
          {tab === 'variantes' && <TabVariantes product={product} />}
          {tab === 'costing' && <TabCosting product={product} />}
          {tab === 'versions' && <TabVersions product={product} />}
          {tab === 'workflows' && <TabWorkflows product={product} />}
        </div>
      </div>

      <ProductFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        collectionId={product.collection_id}
        product={product}
      />
    </div>
  )
}
