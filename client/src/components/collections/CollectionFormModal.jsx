import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../ui/Modal'
import { createCollection, updateCollection } from '../../api/collections.api'

const SEASONS = ['Printemps-Été', 'Automne-Hiver', 'Capsule', 'Resort', 'Pre-Fall']
const STATUSES = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'validee', label: 'Validée' },
  { value: 'archivee', label: 'Archivée' },
]

const EMPTY_FORM = {
  code: '',
  name: '',
  season: '',
  year: new Date().getFullYear(),
  status: 'brouillon',
  target_refs: '',
  budget: '',
  description: '',
  brief_url: '',
  delivery_date: '',
  showroom_date: '',
}

export default function CollectionFormModal({ open, onClose, collection }) {
  const qc = useQueryClient()
  const isEdit = !!collection

  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      if (collection) {
        setForm({
          code: collection.code ?? '',
          name: collection.name ?? '',
          season: collection.season ?? '',
          year: collection.year ?? new Date().getFullYear(),
          status: collection.status ?? 'brouillon',
          target_refs: collection.target_refs ?? '',
          budget: collection.budget ?? '',
          description: collection.description ?? '',
          brief_url: collection.brief_url ?? '',
          delivery_date: collection.delivery_date?.slice(0, 10) ?? '',
          showroom_date: collection.showroom_date?.slice(0, 10) ?? '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
    }
  }, [open, collection])

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateCollection(collection.id, data) : createCollection(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] })
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.error ?? 'Une erreur est survenue')
    },
  })

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const payload = { ...form }
    if (!payload.target_refs) delete payload.target_refs
    else payload.target_refs = Number(payload.target_refs)
    if (!payload.budget) delete payload.budget
    else payload.budget = Number(payload.budget)
    if (!payload.delivery_date) delete payload.delivery_date
    if (!payload.showroom_date) delete payload.showroom_date
    if (!payload.brief_url) delete payload.brief_url
    if (!payload.description) delete payload.description
    payload.year = Number(payload.year)
    mutation.mutate(payload)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier la collection' : 'Nouvelle collection'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Code *</label>
            <input
              required
              value={form.code}
              onChange={set('code')}
              placeholder="SS2026"
              className="input-field uppercase"
              maxLength={20}
            />
          </div>
          <div>
            <label className="label">Nom *</label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              placeholder="Collection Printemps-Été 2026"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Saison</label>
            <select value={form.season} onChange={set('season')} className="input-field">
              <option value="">—</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Année *</label>
            <input
              required
              type="number"
              value={form.year}
              onChange={set('year')}
              min={2020}
              max={2035}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Statut</label>
            <select value={form.status} onChange={set('status')} className="input-field">
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nb références cible</label>
            <input
              type="number"
              value={form.target_refs}
              onChange={set('target_refs')}
              placeholder="80"
              className="input-field"
              min={0}
            />
          </div>
          <div>
            <label className="label">Budget (€)</label>
            <input
              type="number"
              value={form.budget}
              onChange={set('budget')}
              placeholder="150000"
              className="input-field"
              min={0}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date de livraison</label>
            <input type="date" value={form.delivery_date} onChange={set('delivery_date')} className="input-field" />
          </div>
          <div>
            <label className="label">Date showroom</label>
            <input type="date" value={form.showroom_date} onChange={set('showroom_date')} className="input-field" />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            className="input-field resize-none"
            placeholder="Brief créatif, orientation stylistique…"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement…
              </span>
            ) : isEdit ? 'Enregistrer' : 'Créer la collection'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
