// client/src/pages/SupplierDetailPage.jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Star, MapPin, Mail, Phone, Package, ChevronRight, Plus, X } from 'lucide-react'
import { getSupplier, addEvaluation } from '../api/suppliers.api'
import { getPurchases } from '../api/purchases.api'
import Spinner from '../components/ui/Spinner'

// ─── helpers ────────────────────────────────────────────────────────────────

const PO_STATUS = {
  draft:              { label: 'Brouillon',           color: 'bg-dark/5 text-dark/50' },
  sent:               { label: 'Envoyé',              color: 'bg-blue-50 text-blue-600' },
  confirmed:          { label: 'Confirmé',            color: 'bg-amber-50 text-amber-600' },
  in_production:      { label: 'En production',       color: 'bg-purple-50 text-purple-600' },
  shipped:            { label: 'Expédié',             color: 'bg-indigo-50 text-indigo-600' },
  partially_received: { label: 'Partiellement reçu',  color: 'bg-orange-50 text-orange-600' },
  received:           { label: 'Reçu',                color: 'bg-emerald-50 text-emerald-600' },
  validated:          { label: 'Validé',              color: 'bg-emerald-100 text-emerald-700' },
  cancelled:          { label: 'Annulé',              color: 'bg-red-50 text-red-400' },
}

function Stars({ score, size = 14 }) {
  const filled = Math.round(score || 0)
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= filled ? 'text-gold fill-gold' : 'text-dark/20'}
          fill={i <= filled ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  )
}

function Field({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-dark/5 last:border-0">
      <span className="text-xs text-dark/40 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-dark font-medium text-right">{value ?? '—'}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = PO_STATUS[status] || { label: status, color: 'bg-dark/5 text-dark/50' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function SupplierDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEvalForm, setShowEvalForm] = useState(false)
  const [evalForm, setEvalForm] = useState({ score: 3, comment: '' })
  const [evalError, setEvalError] = useState('')

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => getSupplier(id),
  })

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: getPurchases,
  })

  const { mutate: submitEval, isPending: evalPending } = useMutation({
    mutationFn: (data) => addEvaluation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', id] })
      setShowEvalForm(false)
      setEvalForm({ score: 3, comment: '' })
      setEvalError('')
    },
    onError: (err) => setEvalError(err.response?.data?.error || 'Erreur serveur'),
  })

  // ── loading / not found ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="p-8 text-center text-dark/50">
        Fournisseur introuvable.
      </div>
    )
  }

  // ── derived data ─────────────────────────────────────────────────────────

  const evaluations = supplier.evaluations || []
  const avgScore =
    evaluations.length > 0
      ? evaluations.reduce((acc, e) => acc + (e.score || 0), 0) / evaluations.length
      : null

  const supplierPOs = purchases.filter(
    (po) => String(po.supplier_id) === String(supplier.id)
  )

  const certList = supplier.certifications
    ? supplier.certifications.split(',').map((c) => c.trim()).filter(Boolean)
    : []

  const specialtyList = supplier.specialties
    ? supplier.specialties.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  // ── handlers ─────────────────────────────────────────────────────────────

  function handleEvalSubmit(e) {
    e.preventDefault()
    if (!evalForm.score) return
    submitEval(evalForm)
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate('/suppliers')}
          className="flex items-center gap-1 text-dark/50 hover:text-dark transition-colors"
        >
          <ArrowLeft size={14} />
          Fournisseurs
        </button>
        <ChevronRight size={14} className="text-dark/30" />
        <span className="text-dark font-medium">{supplier.name}</span>
      </nav>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-2xl text-dark">{supplier.name}</h1>
              {supplier.code && (
                <span className="px-2 py-0.5 rounded bg-gold/10 text-gold text-xs font-mono font-semibold tracking-wider">
                  {supplier.code}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  supplier.is_active
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-dark/5 text-dark/40'
                }`}
              >
                {supplier.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>

            {(supplier.country || supplier.city) && (
              <div className="flex items-center gap-1 text-sm text-dark/50">
                <MapPin size={13} />
                {[supplier.city, supplier.country].filter(Boolean).join(', ')}
              </div>
            )}

            {avgScore !== null && (
              <div className="flex items-center gap-2">
                <Stars score={avgScore} size={16} />
                <span className="text-sm text-dark/50">
                  {avgScore.toFixed(1)} / 5
                  <span className="ml-1 text-xs">({evaluations.length} éval.)</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left: contact + terms */}
        <div className="card p-6 space-y-4">
          <h2 className="font-serif text-base text-dark">Contact & conditions</h2>

          <div>
            {supplier.contact_name && (
              <div className="flex items-center gap-2 text-sm text-dark py-1">
                <span className="text-dark/40 w-4" />
                <span className="font-medium">{supplier.contact_name}</span>
              </div>
            )}
            {supplier.contact_email && (
              <div className="flex items-center gap-2 text-sm text-dark py-1">
                <Mail size={13} className="text-dark/40 shrink-0" />
                <a
                  href={`mailto:${supplier.contact_email}`}
                  className="text-gold hover:underline"
                >
                  {supplier.contact_email}
                </a>
              </div>
            )}
            {supplier.contact_phone && (
              <div className="flex items-center gap-2 text-sm text-dark py-1">
                <Phone size={13} className="text-dark/40 shrink-0" />
                <a href={`tel:${supplier.contact_phone}`} className="hover:underline">
                  {supplier.contact_phone}
                </a>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-0">
            <Field label="Conditions de paiement" value={supplier.payment_terms} />
            <Field label="Devise" value={supplier.currency} />
            <Field
              label="Délai de livraison"
              value={supplier.lead_time_days ? `${supplier.lead_time_days} jours` : null}
            />
          </div>

          {certList.length > 0 && (
            <div>
              <p className="text-xs text-dark/40 uppercase tracking-wider mb-2">Certifications</p>
              <div className="flex flex-wrap gap-1">
                {certList.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {specialtyList.length > 0 && (
            <div>
              <p className="text-xs text-dark/40 uppercase tracking-wider mb-2">Spécialités</p>
              <div className="flex flex-wrap gap-1">
                {specialtyList.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: notes */}
        <div className="card p-6 space-y-3">
          <h2 className="font-serif text-base text-dark">Notes</h2>
          {supplier.notes ? (
            <p className="text-sm text-dark/70 whitespace-pre-wrap leading-relaxed">
              {supplier.notes}
            </p>
          ) : (
            <p className="text-sm text-dark/30 italic">Aucune note.</p>
          )}
        </div>
      </div>

      {/* Historique BCs */}
      <div className="space-y-3">
        <h2 className="font-serif text-lg text-dark">Historique BCs</h2>

        {supplierPOs.length === 0 ? (
          <div className="card p-6 text-center text-sm text-dark/40">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            Aucun bon de commande pour ce fournisseur.
          </div>
        ) : (
          <div className="card divide-y divide-dark/5">
            {supplierPOs.map((po) => (
              <button
                key={po.id}
                onClick={() => navigate(`/purchases/${po.id}`)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-cream/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold text-dark">
                    {po.reference || `#${po.id}`}
                  </span>
                  <StatusBadge status={po.status} />
                </div>
                <div className="flex items-center gap-6 text-xs text-dark/50">
                  {po.expected_delivery && (
                    <span>Livr. {new Date(po.expected_delivery).toLocaleDateString('fr-FR')}</span>
                  )}
                  {po.total_amount != null && (
                    <span className="font-semibold text-dark">
                      {Number(po.total_amount).toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: po.currency || 'EUR',
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  )}
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Évaluations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-dark">Évaluations</h2>
          {!showEvalForm && (
            <button
              onClick={() => setShowEvalForm(true)}
              className="btn-secondary flex items-center gap-1.5 text-sm"
            >
              <Plus size={14} />
              Ajouter une évaluation
            </button>
          )}
        </div>

        {/* Inline evaluation form */}
        {showEvalForm && (
          <div className="card p-5 space-y-4 border border-gold/30">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-dark text-sm">Nouvelle évaluation</h3>
              <button
                onClick={() => { setShowEvalForm(false); setEvalError('') }}
                className="btn-ghost p-1"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleEvalSubmit} className="space-y-4">
              <div>
                <label className="label">Score</label>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEvalForm((f) => ({ ...f, score: n }))}
                      className="focus:outline-none"
                    >
                      <Star
                        size={22}
                        className={
                          n <= evalForm.score
                            ? 'text-gold fill-gold'
                            : 'text-dark/20 hover:text-gold/50'
                        }
                        fill={n <= evalForm.score ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-dark/50 ml-1">{evalForm.score} / 5</span>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="eval-comment">Commentaire</label>
                <textarea
                  id="eval-comment"
                  className="input-field mt-1 h-24 resize-none"
                  placeholder="Qualité, respect des délais, communication…"
                  value={evalForm.comment}
                  onChange={(e) => setEvalForm((f) => ({ ...f, comment: e.target.value }))}
                />
              </div>

              {evalError && (
                <p className="text-sm text-red-500">{evalError}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowEvalForm(false); setEvalError('') }}
                  className="btn-ghost text-sm"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary text-sm" disabled={evalPending}>
                  {evalPending ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Evaluation list */}
        {evaluations.length === 0 && !showEvalForm ? (
          <div className="card p-6 text-center text-sm text-dark/40">
            <Star size={32} className="mx-auto mb-2 opacity-30" />
            Aucune évaluation enregistrée.
          </div>
        ) : (
          <div className="space-y-3">
            {evaluations.map((ev, idx) => (
              <div key={ev.id ?? idx} className="card p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Stars score={ev.score} size={15} />
                  <div className="flex items-center gap-3 text-xs text-dark/40">
                    {ev.user_name && (
                      <span className="font-medium text-dark/60">{ev.user_name}</span>
                    )}
                    {ev.created_at && (
                      <span>
                        {new Date(ev.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                {ev.comment && (
                  <p className="text-sm text-dark/70 leading-relaxed">{ev.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
