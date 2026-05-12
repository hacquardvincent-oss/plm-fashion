import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveCosting } from '../../api/costing.api'
import { formatCurrency } from '../../utils/status'

const EMPTY = {
  cmt_cost: '', accessories_cost: '', transport_cost: '', customs_cost: '',
  wholesale_price: '', retail_price: '', notes: '',
}

export default function CostingForm({ productId, current }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (current) {
      setForm({
        cmt_cost: current.cmt_cost ?? '',
        accessories_cost: current.accessories_cost ?? '',
        transport_cost: current.transport_cost ?? '',
        customs_cost: current.customs_cost ?? '',
        wholesale_price: current.wholesale_price ?? '',
        retail_price: current.retail_price ?? '',
        notes: current.notes ?? '',
      })
    }
  }, [current])

  const toNum = (v) => (v === '' ? 0 : Number(v))

  const preview = {
    total: toNum(form.cmt_cost) + toNum(form.accessories_cost) +
           toNum(form.transport_cost) + toNum(form.customs_cost) +
           toNum(current?.materials_cost ?? 0),
    retail: toNum(form.retail_price),
  }
  preview.margin = preview.retail > 0
    ? (((preview.retail - preview.total) / preview.retail) * 100).toFixed(1)
    : null
  preview.coeff = preview.total > 0
    ? (preview.retail / preview.total).toFixed(2)
    : null

  const mutation = useMutation({
    mutationFn: (data) => saveCosting(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err) => setError(err.response?.data?.error ?? 'Erreur lors de la sauvegarde'),
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate({
      cmt_cost: toNum(form.cmt_cost),
      accessories_cost: toNum(form.accessories_cost),
      transport_cost: toNum(form.transport_cost),
      customs_cost: toNum(form.customs_cost),
      wholesale_price: form.wholesale_price ? toNum(form.wholesale_price) : undefined,
      retail_price: form.retail_price ? toNum(form.retail_price) : undefined,
      notes: form.notes || undefined,
    })
  }

  const costFields = [
    { key: 'cmt_cost', label: 'Façon / CMT', placeholder: '28.00' },
    { key: 'accessories_cost', label: 'Accessoires', placeholder: '4.50' },
    { key: 'transport_cost', label: 'Transport', placeholder: '3.00' },
    { key: 'customs_cost', label: 'Droits de douane', placeholder: '2.00' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* Matières (lecture seule, calculé depuis BOM) */}
      <div>
        <p className="label">Coûts de production</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-dark/5">
            <span className="text-sm text-dark/50">Matières (depuis BOM)</span>
            <span className="text-sm font-medium text-dark">
              {formatCurrency(current?.materials_cost ?? 0)}
            </span>
          </div>
          {costFields.map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="text-sm text-dark/70 flex-1">{label}</label>
              <div className="relative w-32">
                <input
                  type="number" value={form[key]} onChange={set(key)}
                  placeholder={placeholder} min={0} step="0.01"
                  className="input-field text-right pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dark/30">€</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview total */}
      <div className="bg-gold-subtle rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-semibold text-dark">Coût total</span>
          <span className="text-sm font-semibold text-gold">{formatCurrency(preview.total)}</span>
        </div>
        {preview.margin && (
          <div className="flex justify-between">
            <span className="text-xs text-dark/50">Marge brute</span>
            <span className={`text-xs font-medium ${Number(preview.margin) >= 70 ? 'text-emerald-600' : 'text-orange-500'}`}>
              {preview.margin}%
            </span>
          </div>
        )}
        {preview.coeff && (
          <div className="flex justify-between">
            <span className="text-xs text-dark/50">Coefficient</span>
            <span className="text-xs font-medium text-dark/70">×{preview.coeff}</span>
          </div>
        )}
      </div>

      {/* Prix de vente */}
      <div>
        <p className="label">Prix de vente</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-dark/50 block mb-1">Prix gros (€)</label>
            <input type="number" value={form.wholesale_price} onChange={set('wholesale_price')}
              placeholder="145.00" min={0} step="0.01" className="input-field" />
          </div>
          <div>
            <label className="text-xs text-dark/50 block mb-1">Prix détail (€)</label>
            <input type="number" value={form.retail_price} onChange={set('retail_price')}
              placeholder="290.00" min={0} step="0.01" className="input-field" />
          </div>
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea value={form.notes} onChange={set('notes')} rows={2}
          className="input-field resize-none" placeholder="Hypothèses de calcul, remarques…" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Enregistrement…' : 'Sauvegarder le costing'}
        </button>
        {saved && <span className="text-sm text-emerald-600">✓ Sauvegardé</span>}
      </div>
    </form>
  )
}
