import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Scissors, CheckCircle, Clock, X } from 'lucide-react'
import { getMaterials, createMaterial } from '../api/materials.api'
import { getSuppliers } from '../api/suppliers.api'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'

const TYPES = [
  { value: '', label: 'Tous' },
  { value: 'tissu', label: 'Tissu' },
  { value: 'doublure', label: 'Doublure' },
  { value: 'broderie', label: 'Broderie' },
  { value: 'accessoire', label: 'Accessoire' },
  { value: 'emballage', label: 'Emballage' },
  { value: 'autre', label: 'Autre' },
]

const CAN_CREATE = ['admin', 'chef_produit', 'acheteur']

function MaterialModal({ open, onClose }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    code: '', name: '', type: 'tissu', composition: '', unit: 'ml',
    price_per_unit: '', currency: 'EUR', lead_time_days: '',
    color_name: '', supplier_id: '', notes: '',
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers(),
    enabled: open,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      onClose()
      setForm({ code: '', name: '', type: 'tissu', composition: '', unit: 'ml', price_per_unit: '', currency: 'EUR', lead_time_days: '', color_name: '', supplier_id: '', notes: '' })
      setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Erreur serveur'),
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-dark/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-5 border-b border-dark/10 flex items-center justify-between">
          <h2 className="font-semibold text-dark">Nouvelle matière</h2>
          <button onClick={onClose} className="text-dark/40 hover:text-dark transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[68vh] overflow-y-auto scrollbar-thin">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Code *</label>
              <input className="input-field" value={form.code} onChange={e => set('code', e.target.value)} placeholder="TIS-001" />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Crêpe de soie" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type *</label>
              <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.slice(1).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unité</label>
              <select className="input-field" value={form.unit} onChange={e => set('unit', e.target.value)}>
                <option value="ml">ml — mètre linéaire</option>
                <option value="kg">kg</option>
                <option value="piece">pièce</option>
                <option value="m2">m²</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Composition</label>
            <input className="input-field" value={form.composition} onChange={e => set('composition', e.target.value)} placeholder="100% soie" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prix / unité (€)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.price_per_unit} onChange={e => set('price_per_unit', e.target.value)} placeholder="12.50" />
            </div>
            <div>
              <label className="label">Délai appro (jours)</label>
              <input type="number" min="0" className="input-field" value={form.lead_time_days} onChange={e => set('lead_time_days', e.target.value)} placeholder="21" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Coloris</label>
              <input className="input-field" value={form.color_name} onChange={e => set('color_name', e.target.value)} placeholder="Ivory" />
            </div>
            <div>
              <label className="label">Fournisseur</label>
              <select className="input-field" value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
                <option value="">— Aucun —</option>
                {(suppliers ?? []).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input-field resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Remarques..." />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-dark/10 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button
            onClick={() => mutate(form)}
            disabled={isPending || !form.code || !form.name}
            className="btn-primary"
          >
            {isPending ? 'Création…' : 'Créer la matière'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MaterialsPage() {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterValidated, setFilterValidated] = useState('')
  const [search, setSearch] = useState('')

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', filterType, filterValidated],
    queryFn: () => getMaterials({
      ...(filterType && { type: filterType }),
      ...(filterValidated !== '' && { is_validated: filterValidated }),
    }),
  })

  const filtered = (materials ?? []).filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.name?.toLowerCase().includes(q) ||
      m.code?.toLowerCase().includes(q) ||
      m.supplier_name?.toLowerCase().includes(q) ||
      m.composition?.toLowerCase().includes(q)
    )
  })

  const canCreate = CAN_CREATE.includes(user?.role)

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-44 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="input-field pl-9 py-2" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-dark/10 rounded-lg p-1">
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === t.value ? 'bg-gold text-white shadow-sm' : 'text-dark/50 hover:text-dark hover:bg-dark/5'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <select value={filterValidated} onChange={e => setFilterValidated(e.target.value)} className="input-field w-auto py-2 pr-8">
          <option value="">Tous statuts</option>
          <option value="true">Validées</option>
          <option value="false">En attente</option>
        </select>
        {canCreate && (
          <button onClick={() => setModalOpen(true)} className="btn-primary ml-auto">
            <Plus size={15} /> Nouvelle matière
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Scissors} title="Aucune matière"
          description={search ? 'Aucun résultat pour cette recherche.' : 'Ajoutez votre première matière au catalogue.'}
          action={canCreate && !search ? <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={15} /> Nouvelle matière</button> : undefined} />
      ) : (
        <>
          <p className="text-xs text-dark/40">{filtered.length} matière{filtered.length > 1 ? 's' : ''}</p>
          <div className="bg-white rounded-xl border border-dark/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dark/10">
                <tr>
                  {['Code', 'Nom', 'Type', 'Composition', 'Fournisseur', 'Prix / unité', 'Délai', 'Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/5">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-cream/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-dark/50 whitespace-nowrap">{m.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-dark">{m.name}</div>
                      {m.color_name && <div className="text-xs text-dark/40 mt-0.5">{m.color_name}</div>}
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-dark/5 rounded-full text-xs capitalize">{m.type}</span></td>
                    <td className="px-4 py-3 text-dark/60 text-xs max-w-[160px] truncate">{m.composition || '—'}</td>
                    <td className="px-4 py-3 text-dark/70 whitespace-nowrap">{m.supplier_name || '—'}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{m.price_per_unit ? `${parseFloat(m.price_per_unit).toFixed(2)} €/${m.unit}` : '—'}</td>
                    <td className="px-4 py-3 text-dark/60 whitespace-nowrap">{m.lead_time_days ? `${m.lead_time_days} j` : '—'}</td>
                    <td className="px-4 py-3">
                      {m.is_validated ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium whitespace-nowrap"><CheckCircle size={13} /> Validée</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium whitespace-nowrap"><Clock size={13} /> En attente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <MaterialModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
