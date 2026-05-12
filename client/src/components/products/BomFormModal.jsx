import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Modal from '../ui/Modal'
import { addBomLine } from '../../api/products.api'
import { getMaterials } from '../../api/materials.api'

const UNITS = ['ml', 'm', 'cm', 'kg', 'g', 'pièce']
const USAGE_TYPES = ['Corps principal', 'Doublure', 'Fermeture', 'Broderie', 'Garniture', 'Emballage', 'Autre']

export default function BomFormModal({ open, onClose, productId }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    material_id: '', usage_type: '', quantity: '', unit: 'ml', waste_factor: '0.05', notes: '',
  })
  const [error, setError] = useState('')

  const { data: materials } = useQuery({
    queryKey: ['materials', search],
    queryFn: () => getMaterials({ search }),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (data) => addBomLine(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId] })
      onClose()
      setForm({ material_id: '', usage_type: '', quantity: '', unit: 'ml', waste_factor: '0.05', notes: '' })
    },
    onError: (err) => setError(err.response?.data?.error ?? 'Erreur lors de l\'ajout'),
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate({
      material_id: form.material_id,
      usage_type: form.usage_type || undefined,
      quantity: Number(form.quantity),
      unit: form.unit,
      waste_factor: Number(form.waste_factor),
      notes: form.notes || undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une matière (BOM)">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Rechercher une matière</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cuir, coton, zip…" className="input-field mb-2" />
          <select required value={form.material_id} onChange={set('material_id')} className="input-field">
            <option value="">— Sélectionner —</option>
            {(materials ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code}) — {m.type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Usage</label>
          <select value={form.usage_type} onChange={set('usage_type')} className="input-field">
            <option value="">—</option>
            {USAGE_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label">Quantité *</label>
            <input required type="number" value={form.quantity} onChange={set('quantity')}
              placeholder="1.5" className="input-field" min={0} step="0.0001" />
          </div>
          <div>
            <label className="label">Unité *</label>
            <select required value={form.unit} onChange={set('unit')} className="input-field">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Taux de perte</label>
          <input type="number" value={form.waste_factor} onChange={set('waste_factor')}
            placeholder="0.05" className="input-field" min={0} max={1} step="0.01" />
          <p className="text-xs text-dark/30 mt-1">Ex : 0.05 = 5% de perte</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
