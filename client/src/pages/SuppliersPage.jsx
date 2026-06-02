import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Truck, Star, Mail, Phone, MapPin, X } from 'lucide-react'
import { getSuppliers, createSupplier } from '../api/suppliers.api'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'

const CAN_CREATE = ['admin', 'acheteur', 'chef_produit']

function ScoreBadge({ score }) {
  if (!score) return <span className="text-dark/30 text-xs">—</span>
  const s = parseFloat(score)
  const color = s >= 4 ? 'text-emerald-600' : s >= 2.5 ? 'text-amber-500' : 'text-red-500'
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
      <Star size={11} fill="currentColor" />{s.toFixed(1)}/5
    </span>
  )
}

function SupplierModal({ open, onClose }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    code: '', name: '', country: '', city: '',
    contact_name: '', contact_email: '', contact_phone: '',
    currency: 'EUR', payment_terms: '', lead_time_days: '',
    certifications: '', specialties: '', notes: '',
  })

  const { mutate, isPending } = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      onClose()
      setForm({ code: '', name: '', country: '', city: '', contact_name: '', contact_email: '', contact_phone: '', currency: 'EUR', payment_terms: '', lead_time_days: '', certifications: '', specialties: '', notes: '' })
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
          <h2 className="font-semibold text-dark">Nouveau fournisseur</h2>
          <button onClick={onClose} className="text-dark/40 hover:text-dark transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[68vh] overflow-y-auto scrollbar-thin">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Code *</label><input className="input-field" value={form.code} onChange={e => set('code', e.target.value)} placeholder="FRN-001" /></div>
            <div><label className="label">Nom *</label><input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Italtex SRL" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Pays</label><input className="input-field" value={form.country} onChange={e => set('country', e.target.value)} placeholder="IT" /></div>
            <div><label className="label">Ville</label><input className="input-field" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Biella" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Contact</label><input className="input-field" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Marco Rossi" /></div>
            <div><label className="label">Email</label><input type="email" className="input-field" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Téléphone</label><input className="input-field" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} /></div>
            <div><label className="label">Délai moyen (jours)</label><input type="number" min="0" className="input-field" value={form.lead_time_days} onChange={e => set('lead_time_days', e.target.value)} placeholder="30" /></div>
          </div>
          <div><label className="label">Spécialités</label><input className="input-field" value={form.specialties} onChange={e => set('specialties', e.target.value)} placeholder="Tissus jacquard, doublures soie…" /></div>
          <div><label className="label">Certifications</label><input className="input-field" value={form.certifications} onChange={e => set('certifications', e.target.value)} placeholder="OEKO-TEX, GOTS…" /></div>
          <div><label className="label">Conditions de paiement</label><input className="input-field" value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} placeholder="30 jours net" /></div>
          <div><label className="label">Notes</label><textarea className="input-field resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Remarques…" /></div>
        </div>
        <div className="px-6 py-4 border-t border-dark/10 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={() => mutate(form)} disabled={isPending || !form.code || !form.name} className="btn-primary">
            {isPending ? 'Création…' : 'Créer le fournisseur'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SupplierCard({ supplier }) {
  const navigate = useNavigate()
  return (
    <div onClick={() => navigate(`/suppliers/${supplier.id}`)}
      className="bg-white rounded-xl border border-dark/10 p-5 space-y-3 hover:shadow-md hover:border-gold/30 transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-dark truncate">{supplier.name}</h3>
          <span className="font-mono text-xs text-dark/40">{supplier.code}</span>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <ScoreBadge score={supplier.avg_score} />
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${supplier.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-dark/5 text-dark/40'}`}>
            {supplier.is_active !== false ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>
      {(supplier.city || supplier.country) && (
        <div className="flex items-center gap-1.5 text-xs text-dark/50"><MapPin size={12} />{[supplier.city, supplier.country].filter(Boolean).join(', ')}</div>
      )}
      {supplier.contact_name && <div className="text-xs font-medium text-dark/70">{supplier.contact_name}</div>}
      <div className="flex flex-col gap-1">
        {supplier.contact_email && (
          <a href={`mailto:${supplier.contact_email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-gold hover:underline truncate">
            <Mail size={11} />{supplier.contact_email}
          </a>
        )}
        {supplier.contact_phone && (
          <span className="flex items-center gap-1.5 text-xs text-dark/50"><Phone size={11} />{supplier.contact_phone}</span>
        )}
      </div>
      {supplier.specialties && <p className="text-xs text-dark/40 italic leading-relaxed line-clamp-2">{supplier.specialties}</p>}
      <div className="flex items-center gap-4 pt-1 border-t border-dark/5">
        {supplier.lead_time_days && <div className="text-xs text-dark/50">Délai : <span className="font-medium text-dark">{supplier.lead_time_days} j</span></div>}
        {supplier.certifications && <div className="text-xs text-dark/40 truncate">{supplier.certifications}</div>}
      </div>
    </div>
  )
}

export default function SuppliersPage() {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [filterActive, setFilterActive] = useState('')
  const [search, setSearch] = useState('')

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', filterActive],
    queryFn: () => getSuppliers({ ...(filterActive !== '' && { is_active: filterActive }) }),
  })

  const filtered = (suppliers ?? []).filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q) || s.country?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.specialties?.toLowerCase().includes(q)
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
          {[{ v: '', l: 'Tous' }, { v: 'true', l: 'Actifs' }, { v: 'false', l: 'Inactifs' }].map(f => (
            <button key={f.v} onClick={() => setFilterActive(f.v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterActive === f.v ? 'bg-gold text-white shadow-sm' : 'text-dark/50 hover:text-dark hover:bg-dark/5'}`}>
              {f.l}
            </button>
          ))}
        </div>
        {canCreate && (
          <button onClick={() => setModalOpen(true)} className="btn-primary ml-auto">
            <Plus size={15} /> Nouveau fournisseur
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Truck} title="Aucun fournisseur"
          description={search ? 'Aucun résultat pour cette recherche.' : "Ajoutez votre premier fournisseur à l'annuaire."}
          action={canCreate && !search ? <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={15} /> Nouveau fournisseur</button> : undefined} />
      ) : (
        <>
          <p className="text-xs text-dark/40">{filtered.length} fournisseur{filtered.length > 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(s => <SupplierCard key={s.id} supplier={s} />)}
          </div>
        </>
      )}

      <SupplierModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
