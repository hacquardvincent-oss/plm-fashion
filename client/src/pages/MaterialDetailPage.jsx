import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, X, Save, ShoppingCart } from 'lucide-react'
import { getMaterial, updateMaterial } from '../api/materials.api'
import apiClient from '../api/client'
import Spinner from '../components/ui/Spinner'

// ── helpers ─────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const STATUS_BADGE = {
  pending:   'bg-amber-100 text-amber-700 border border-amber-200',
  validated: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  archived:  'bg-gray-100 text-gray-500 border border-gray-200',
}

const STATUS_LABEL = {
  pending:   'En attente',
  validated: 'Validé',
  archived:  'Archivé',
}

function StatusBadge({ status }) {
  const cls = STATUS_BADGE[status] ?? STATUS_BADGE.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function TypeBadge({ type }) {
  if (!type) return null
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream text-dark/60 border border-dark/10">
      {type}
    </span>
  )
}

// ── page ────────────────────────────────────────────────────────────────────

export default function MaterialDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')

  // ── queries ──────────────────────────────────────────────────────────────

  const {
    data: material,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['material', id],
    queryFn: () => getMaterial(id),
  })

  // ── mutations ────────────────────────────────────────────────────────────

  const validateMutation = useMutation({
    mutationFn: () => apiClient.patch(`/materials/${id}/validate`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['material', id] }),
  })

  const updateNotesMutation = useMutation({
    mutationFn: (notes) => updateMaterial(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', id] })
      setEditingNotes(false)
    },
  })

  // ── edit helpers ─────────────────────────────────────────────────────────

  function startEditNotes() {
    setNotesValue(material?.notes ?? '')
    setEditingNotes(true)
  }

  function cancelEditNotes() {
    setEditingNotes(false)
    setNotesValue('')
  }

  // ── render states ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card p-6 text-center text-red-600">
          <p className="font-medium">Erreur lors du chargement</p>
          <p className="text-sm text-dark/50 mt-1">{error?.message ?? 'Une erreur est survenue.'}</p>
          <button className="btn-secondary mt-4" onClick={() => navigate(-1)}>
            Retour
          </button>
        </div>
      </div>
    )
  }

  const m = material

  // ── main render ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-dark/50">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost flex items-center gap-1 px-2 py-1 -ml-2"
        >
          <ArrowLeft size={15} />
          <span>Matières</span>
        </button>
        <span>/</span>
        <span className="text-dark font-medium truncate">{m.name}</span>
      </nav>

      {/* Header card */}
      <div className="card p-6 space-y-4">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          {m.code && (
            <span className="font-mono text-xs bg-dark/5 text-dark/70 px-2 py-0.5 rounded border border-dark/10">
              {m.code}
            </span>
          )}
          {m.type && <TypeBadge type={m.type} />}
          <StatusBadge status={m.status} />
        </div>

        {/* Name */}
        <div>
          <h1 className="font-serif text-2xl text-dark">{m.name}</h1>
          {m.composition && (
            <p className="text-sm text-dark/60 mt-0.5">{m.composition}</p>
          )}
          {m.color_name && (
            <p className="text-sm text-dark/50 mt-0.5">Coloris : {m.color_name}</p>
          )}
        </div>

        {/* Validate button */}
        {m.status === 'pending' && (
          <div className="pt-2">
            <button
              className="btn-primary"
              onClick={() => validateMutation.mutate()}
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? 'Validation…' : 'Valider la matière'}
            </button>
            {validateMutation.isError && (
              <p className="text-red-500 text-sm mt-1">
                {validateMutation.error?.message ?? 'Erreur lors de la validation.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left: logistical info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-dark/40">
            Informations
          </h2>

          <dl className="space-y-3">
            {m.unit && (
              <div>
                <dt className="label">Unité</dt>
                <dd className="text-dark">{m.unit}</dd>
              </div>
            )}

            {m.price_per_unit != null && (
              <div>
                <dt className="label">Prix unitaire</dt>
                <dd className="text-dark">
                  {Number(m.price_per_unit).toFixed(2)}{' '}
                  <span className="text-dark/50">{m.currency ?? '€'}</span>
                </dd>
              </div>
            )}

            {m.lead_time_days != null && (
              <div>
                <dt className="label">Délai d'approvisionnement</dt>
                <dd className="text-dark">{m.lead_time_days} jour{m.lead_time_days !== 1 ? 's' : ''}</dd>
              </div>
            )}

            {m.supplier_name && (
              <div>
                <dt className="label">Fournisseur</dt>
                <dd className="text-dark">{m.supplier_name}</dd>
              </div>
            )}

            {m.created_at && (
              <div>
                <dt className="label">Créé le</dt>
                <dd className="text-dark">{formatDate(m.created_at)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Right: notes with inline edit */}
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-dark/40">
              Notes
            </h2>
            {!editingNotes && (
              <button
                className="btn-ghost p-1.5 text-dark/30 hover:text-gold"
                onClick={startEditNotes}
                title="Modifier les notes"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>

          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                className="input-field w-full min-h-[120px] resize-y text-sm"
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Ajouter des notes…"
              />
              <div className="flex items-center gap-2">
                <button
                  className="btn-primary flex items-center gap-1.5 text-sm py-1.5"
                  onClick={() => updateNotesMutation.mutate(notesValue)}
                  disabled={updateNotesMutation.isPending}
                >
                  <Save size={13} />
                  {updateNotesMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  className="btn-ghost flex items-center gap-1.5 text-sm py-1.5"
                  onClick={cancelEditNotes}
                  disabled={updateNotesMutation.isPending}
                >
                  <X size={13} />
                  Annuler
                </button>
              </div>
              {updateNotesMutation.isError && (
                <p className="text-red-500 text-sm">
                  {updateNotesMutation.error?.message ?? 'Erreur lors de la sauvegarde.'}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-dark/70 whitespace-pre-wrap leading-relaxed">
              {m.notes ? m.notes : <span className="italic text-dark/30">Aucune note.</span>}
            </p>
          )}
        </div>
      </div>

      {/* BCs associés */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-gold" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-dark/40">
            BCs associés
          </h2>
        </div>
        <p className="text-sm text-dark/60">
          Pour voir les bons de commande contenant cette matière, filtrez par matière dans le module Achats.
        </p>
        <Link to="/purchases" className="btn-secondary inline-flex items-center gap-1.5 text-sm">
          <ShoppingCart size={13} />
          Aller aux Achats
        </Link>
      </div>

    </div>
  )
}
