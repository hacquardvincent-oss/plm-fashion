import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../ui/Modal'
import { addVariant } from '../../api/products.api'

const SIZE_SYSTEMS = ['FR', 'IT', 'US', 'UK', 'EU', 'Unique']

export default function VariantFormModal({ open, onClose, productId }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    sku: '', color_name: '', color_ref: '', size: '', size_system: 'FR', barcode: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => addVariant(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId] })
      onClose()
      setForm({ sku: '', color_name: '', color_ref: '', size: '', size_system: 'FR', barcode: '' })
    },
    onError: (err) => setError(err.response?.data?.error ?? 'Erreur lors de l\'ajout'),
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const payload = { ...form }
    if (!payload.color_name) delete payload.color_name
    if (!payload.color_ref) delete payload.color_ref
    if (!payload.size) delete payload.size
    if (!payload.barcode) delete payload.barcode
    mutation.mutate(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une variante">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">SKU *</label>
          <input required value={form.sku} onChange={set('sku')}
            placeholder="SS26-PAP-001-NOIR-36" className="input-field uppercase" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nom coloris</label>
            <input value={form.color_name} onChange={set('color_name')}
              placeholder="Noir Profond" className="input-field" />
          </div>
          <div>
            <label className="label">Réf. couleur (Pantone/NCS)</label>
            <input value={form.color_ref} onChange={set('color_ref')}
              placeholder="Pantone Black 6 C" className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Taille</label>
            <input value={form.size} onChange={set('size')}
              placeholder="36 / XS / Unique" className="input-field" />
          </div>
          <div>
            <label className="label">Système de tailles</label>
            <select value={form.size_system} onChange={set('size_system')} className="input-field">
              {SIZE_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Code-barres (EAN)</label>
          <input value={form.barcode} onChange={set('barcode')}
            placeholder="3700000000000" className="input-field" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Ajout…' : 'Ajouter la variante'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
