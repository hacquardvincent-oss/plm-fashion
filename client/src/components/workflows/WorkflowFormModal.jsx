import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../ui/Modal'
import { createWorkflow } from '../../api/workflows.api'

const STAGES = [
  { value: 'proto_1', label: 'Proto 1' },
  { value: 'proto_2', label: 'Proto 2' },
  { value: 'sms', label: 'SMS' },
  { value: 'valide', label: 'Validation finale' },
]
const NEXT_STAGES = [
  { value: '', label: '— Aucun —' },
  { value: 'proto_1', label: 'Proto 1' },
  { value: 'proto_2', label: 'Proto 2' },
  { value: 'sms', label: 'SMS' },
  { value: 'valide', label: 'Validé' },
  { value: 'abandonne', label: 'Abandonné' },
]

export default function WorkflowFormModal({ open, onClose, productId }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ stage: 'proto_1', due_date: '', next_stage: '', comments: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => createWorkflow(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId] })
      qc.invalidateQueries({ queryKey: ['workflows'] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.error ?? 'Erreur'),
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate({
      product_id: productId,
      stage: form.stage,
      due_date: form.due_date || undefined,
      next_stage: form.next_stage || undefined,
      comments: form.comments || undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Demander une validation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Étape de validation *</label>
          <select required value={form.stage} onChange={set('stage')} className="input-field">
            {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Étape suivante si approuvé</label>
          <select value={form.next_stage} onChange={set('next_stage')} className="input-field">
            {NEXT_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date limite</label>
          <input type="date" value={form.due_date} onChange={set('due_date')} className="input-field" />
        </div>
        <div>
          <label className="label">Commentaire</label>
          <textarea value={form.comments} onChange={set('comments')} rows={3}
            className="input-field resize-none" placeholder="Points à valider, remarques…" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Envoi…' : 'Soumettre'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
