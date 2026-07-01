import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Modal from '../ui/Modal'
import { createProduct, updateProduct } from '../../api/products.api'
import { getSuppliers } from '../../api/suppliers.api'
import ReturnInsightsPanel from '../returns/ReturnInsightsPanel'

const TYPES = [
  { value: 'pret_a_porter', label: 'Prêt-à-porter' },
  { value: 'maroquinerie', label: 'Maroquinerie' },
  { value: 'accessoire', label: 'Accessoire' },
]
const GENDERS = ['femme', 'homme', 'mixte', 'enfant']
const STATUSES = [
  { value: 'concept', label: 'Concept' },
  { value: 'en_developpement', label: 'En développement' },
  { value: 'proto_1', label: 'Proto 1' },
  { value: 'proto_2', label: 'Proto 2' },
  { value: 'sms', label: 'SMS' },
  { value: 'valide', label: 'Validé' },
  { value: 'abandonne', label: 'Abandonné' },
]

const EMPTY = {
  reference: '', name: '', type: 'pret_a_porter', status: 'concept',
  gender: '', family: '', sub_family: '', description: '', style_notes: '',
  target_retail_price: '', target_cost: '', target_margin: '',
  main_supplier_id: '', erp_article_code: '',
}

export default function ProductFormModal({ open, onClose, collectionId, product }) {
  const qc = useQueryClient()
  const isEdit = !!product
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers(),
    enabled: open,
  })

  useEffect(() => {
    if (!open) return
    setError('')
    if (product) {
      setForm({
        reference: product.reference ?? '',
        name: product.name ?? '',
        type: product.type ?? 'pret_a_porter',
        status: product.status ?? 'concept',
        gender: product.gender ?? '',
        family: product.family ?? '',
        sub_family: product.sub_family ?? '',
        description: product.description ?? '',
        style_notes: product.style_notes ?? '',
        target_retail_price: product.target_retail_price ?? '',
        target_cost: product.target_cost ?? '',
        target_margin: product.target_margin ?? '',
        main_supplier_id: product.main_supplier_id ?? '',
        erp_article_code: product.erp_article_code ?? '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, product])

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateProduct(product.id, data) : createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['collections'] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.error ?? 'Une erreur est survenue'),
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const payload = { ...form, collection_id: collectionId }
    const numFields = ['target_retail_price', 'target_cost', 'target_margin']
    numFields.forEach((f) => {
      if (payload[f] === '') delete payload[f]
      else payload[f] = Number(payload[f])
    })
    if (!payload.gender) delete payload.gender
    if (!payload.family) delete payload.family
    if (!payload.sub_family) delete payload.sub_family
    if (!payload.description) delete payload.description
    if (!payload.style_notes) delete payload.style_notes
    if (!payload.main_supplier_id) delete payload.main_supplier_id
    if (!payload.erp_article_code) delete payload.erp_article_code
    mutation.mutate(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Modifier le produit' : 'Nouveau produit'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Référence *</label>
            <input required value={form.reference} onChange={set('reference')}
              placeholder="SS26-PAP-001" className="input-field uppercase" maxLength={50} />
          </div>
          <div>
            <label className="label">Nom *</label>
            <input required value={form.name} onChange={set('name')}
              placeholder="Veste oversize lin" className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Type *</label>
            <select required value={form.type} onChange={set('type')} className="input-field">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Genre</label>
            <select value={form.gender} onChange={set('gender')} className="input-field">
              <option value="">—</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Statut</label>
            <select value={form.status} onChange={set('status')} className="input-field">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Famille</label>
            <input value={form.family} onChange={set('family')}
              placeholder="Vestes, Sacs à main…" className="input-field" />
          </div>
          <div>
            <label className="label">Sous-famille</label>
            <input value={form.sub_family} onChange={set('sub_family')}
              placeholder="Blazers, Totes…" className="input-field" />
          </div>
        </div>

        {/* Recommandations retours clients — live selon type/famille saisis */}
        <ReturnInsightsPanel type={form.type} family={form.family} subFamily={form.sub_family} compact />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Prix cible détail (€)</label>
            <input type="number" value={form.target_retail_price} onChange={set('target_retail_price')}
              placeholder="290" className="input-field" min={0} step="0.01" />
          </div>
          <div>
            <label className="label">Coût cible (€)</label>
            <input type="number" value={form.target_cost} onChange={set('target_cost')}
              placeholder="58" className="input-field" min={0} step="0.01" />
          </div>
          <div>
            <label className="label">Marge cible (%)</label>
            <input type="number" value={form.target_margin} onChange={set('target_margin')}
              placeholder="80" className="input-field" min={0} max={100} step="0.1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fournisseur principal</label>
            <select value={form.main_supplier_id} onChange={set('main_supplier_id')} className="input-field">
              <option value="">—</option>
              {(suppliers ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Code ERP</label>
            <input value={form.erp_article_code} onChange={set('erp_article_code')}
              placeholder="ART-00123" className="input-field" />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={set('description')}
            rows={2} className="input-field resize-none"
            placeholder="Description générale du produit…" />
        </div>
        <div>
          <label className="label">Notes de style</label>
          <textarea value={form.style_notes} onChange={set('style_notes')}
            rows={2} className="input-field resize-none"
            placeholder="Inspirations, détails créatifs, contraintes…" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement…
              </span>
            ) : isEdit ? 'Enregistrer' : 'Créer le produit'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
