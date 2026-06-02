import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { getSuppliers } from '../api/suppliers.api'
import { getMaterials } from '../api/materials.api'
import { createPurchase } from '../api/purchases.api'
import apiClient from '../api/client'
import Spinner from '../components/ui/Spinner'

const UNITS = ['ml', 'pce', 'kg', 'm²', 'lot']

function emptyLine() {
  return { designation: '', coloris: '', quantity_ordered: '', unit: 'ml', unit_price: '', material_id: '' }
}

export default function NewPurchaseOrderPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [supplierId, setSupplierId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [carrier, setCarrier] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([emptyLine()])
  const [error, setError] = useState('')

  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => getSuppliers() })
  const { data: materials = [] } = useQuery({ queryKey: ['materials'], queryFn: () => getMaterials() })
  const { data: collections = [] } = useQuery({
    queryKey: ['collections-list'],
    queryFn: () => apiClient.get('/collections').then(r => r.data?.collections ?? r.data ?? []),
  })

  const mutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: (po) => {
      qc.invalidateQueries(['purchases'])
      qc.invalidateQueries(['purchase-stats'])
      navigate(`/purchases/${po.id}`)
    },
    onError: (e) => setError(e.response?.data?.error ?? e.message),
  })

  const updateLine = (i, field, value) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  const addLine = () => setLines(prev => [...prev, emptyLine()])
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!supplierId) { setError('Veuillez sélectionner un fournisseur.'); return }
    const validLines = lines.filter(l => l.designation.trim())
    if (validLines.length === 0) { setError('Ajoutez au moins une ligne.'); return }
    mutation.mutate({
      supplier_id: supplierId,
      collection_id: collectionId || null,
      expected_delivery: expectedDelivery || null,
      carrier: carrier || null,
      notes: notes || null,
      lines: validLines.map(l => ({
        ...l,
        material_id: l.material_id || null,
        quantity_ordered: Number(l.quantity_ordered) || 0,
        unit_price: Number(l.unit_price) || 0,
      })),
    })
  }

  const totalEstime = lines.reduce((s, l) => s + (Number(l.quantity_ordered) || 0) * (Number(l.unit_price) || 0), 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/purchases" className="btn-ghost -ml-1 text-dark/50">
          <ArrowLeft size={14} /> Achats
        </Link>
        <span className="text-dark/20">/</span>
        <span className="text-dark/40">Nouveau bon de commande</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-dark">Nouveau bon de commande</h1>
          <p className="text-sm text-dark/40 mt-0.5">Statut initial : Brouillon</p>
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? <Spinner size="sm" /> : <Save size={14} />}
          Créer le BC
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* Informations générales */}
      <div className="card p-6 space-y-4">
        <h2 className="font-medium text-dark text-sm uppercase tracking-wider text-dark/50">Informations générales</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Fournisseur *</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="input-field">
              <option value="">— Sélectionner —</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Collection</label>
            <select value={collectionId} onChange={e => setCollectionId(e.target.value)} className="input-field">
              <option value="">— Aucune —</option>
              {(Array.isArray(collections) ? collections : []).map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.season ? `· ${c.season}` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date de livraison prévue</label>
            <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="label">Transporteur</label>
            <input type="text" placeholder="DHL, Geodis…" value={carrier} onChange={e => setCarrier(e.target.value)} className="input-field" />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Instructions spécifiques, priorité, conditions…"
            className="input-field resize-none" />
        </div>
      </div>

      {/* Lignes de commande */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm uppercase tracking-wider text-dark/50">Lignes de commande</h2>
          <button type="button" onClick={addLine} className="btn-ghost text-xs">
            <Plus size={13} /> Ajouter une ligne
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="bg-dark/2 rounded-xl border border-dark/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark/30 font-mono uppercase">Ligne {i + 1}</span>
                {lines.length > 1 && (
                  <button type="button" onClick={() => removeLine(i)} className="text-dark/30 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="label">Désignation *</label>
                  <input type="text" value={line.designation} onChange={e => updateLine(i, 'designation', e.target.value)}
                    placeholder="Ex : Satin Lourd 100% PL" className="input-field" />
                </div>
                <div>
                  <label className="label">Coloris</label>
                  <input type="text" value={line.coloris} onChange={e => updateLine(i, 'coloris', e.target.value)}
                    placeholder="Ex : Rose 441" className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="label">Quantité</label>
                  <input type="number" value={line.quantity_ordered} onChange={e => updateLine(i, 'quantity_ordered', e.target.value)}
                    min={0} step="0.01" placeholder="0" className="input-field" />
                </div>
                <div>
                  <label className="label">Unité</label>
                  <select value={line.unit} onChange={e => updateLine(i, 'unit', e.target.value)} className="input-field">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Prix unitaire (€)</label>
                  <input type="number" value={line.unit_price} onChange={e => updateLine(i, 'unit_price', e.target.value)}
                    min={0} step="0.01" placeholder="0.00" className="input-field" />
                </div>
                <div>
                  <label className="label">Matière (opt.)</label>
                  <select value={line.material_id} onChange={e => updateLine(i, 'material_id', e.target.value)} className="input-field">
                    <option value="">— Aucune —</option>
                    {(Array.isArray(materials) ? materials : []).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {line.quantity_ordered && line.unit_price && (
                <p className="text-xs text-dark/40 text-right">
                  Sous-total : {(Number(line.quantity_ordered) * Number(line.unit_price)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-end pt-2 border-t border-dark/5">
          <div className="text-right">
            <p className="text-xs text-dark/40 uppercase tracking-wider">Total estimé</p>
            <p className="text-xl font-serif text-dark mt-0.5">
              {totalEstime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-6">
        <Link to="/purchases" className="btn-secondary">Annuler</Link>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? <Spinner size="sm" /> : <Save size={14} />}
          Créer le BC
        </button>
      </div>
    </form>
  )
}
