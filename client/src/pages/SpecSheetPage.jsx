import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, FileText, Scissors, Ruler, Hand,
  MessageSquare, Tag, Image, Save, Plus, Check, Clock,
  ChevronRight, AlertCircle, Upload, Trash2, Download,
} from 'lucide-react'
import { getSpecSheet, saveSpecSheet, addComment } from '../api/specsheets.api'
import { getProduct } from '../api/products.api'
import apiClient from '../api/client'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'

const TABS = [
  { id: 'fiche',        label: 'Fiche technique',  icon: FileText },
  { id: 'fcm',          label: 'FCM',              icon: Scissors },
  { id: 'mesures',      label: 'Mesures & Grading', icon: Ruler },
  { id: 'prise',        label: 'Prise de mesures', icon: Hand },
  { id: 'commentaires', label: 'Commentaires',     icon: MessageSquare },
  { id: 'labelling',    label: 'Labelling',        icon: Tag },
  { id: 'croquis',      label: 'Croquis',          icon: Image },
]

const CAN_EDIT = ['admin', 'chef_produit', 'directeur_artistique']

// ── Sous-composants ──────────────────────────────────────────

function Field({ label, value, mono = false }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-dark/5">
      <span className="text-xs text-dark/40 uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-dark font-medium text-right ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h3 className="text-xs font-semibold uppercase tracking-widest text-gold mb-3 mt-6 first:mt-0">{children}</h3>
}

function SaveButton({ onClick, saving, saved }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        saved ? 'bg-emerald-50 text-emerald-700' : 'btn-primary'
      }`}
    >
      {saving ? <Spinner size="xs" /> : saved ? <Check size={14} /> : <Save size={14} />}
      {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
    </button>
  )
}

// ── Onglet 1 : Fiche technique ────────────────────────────────

function TabFicheTechnique({ data, onChange, canEdit }) {
  const ft = data ?? {}

  const update = (key, val) => onChange({ ...ft, [key]: val })

  const ENTRETIEN_OPTIONS = [
    'Lavage main 30°C', 'Lavage machine 30°C délicat', 'Ne pas laver', 'Ne pas essorer',
    'Séchage à plat', 'Séchage à l\'air libre', 'Séchage à l\'ombre',
    'Repassage fer doux 130°C', 'Repassage fer doux 150°C', 'Ne pas repasser',
    'Nettoyage à sec autorisé', 'Nettoyage à sec déconseillé',
    'Ne pas mettre au sèche-linge',
  ]

  return (
    <div className="space-y-1">
      <SectionTitle>Identification</SectionTitle>
      <div className="grid grid-cols-2 gap-x-8">
        {[
          ['Code thème', 'theme_code'],
          ['Code modèle', 'modele_code'],
          ['Fabricant', 'fabricant'],
          ['Saison', 'saison'],
          ['Année', 'annee'],
          ['Genre', 'genre'],
          ['Catégorie', 'categorie'],
          ['Pays de fabrication', 'pays_fabrication'],
        ].map(([label, key]) => (
          canEdit ? (
            <div key={key} className="flex justify-between items-center py-2 border-b border-dark/5">
              <span className="text-xs text-dark/40 uppercase tracking-wider">{label}</span>
              <input
                className="text-sm text-dark font-medium text-right bg-transparent border-none outline-none focus:bg-cream rounded px-1 w-48"
                value={ft[key] ?? ''}
                onChange={(e) => update(key, e.target.value)}
              />
            </div>
          ) : (
            <Field key={key} label={label} value={ft[key]} />
          )
        ))}
      </div>

      <SectionTitle>Matière principale</SectionTitle>
      <div className="grid grid-cols-2 gap-x-8">
        {[
          ['Matière', 'matiere_principale'],
          ['Composition', 'composition'],
          ['Grammage (g/m²)', 'grammage_gsm'],
          ['Largeur (cm)', 'largeur_cm'],
          ['Certification', 'certification'],
          ['Norme qualité', 'norme_qualite'],
          ['Réf. fournisseur tissu', 'ref_fournisseur_tissu'],
        ].map(([label, key]) => (
          canEdit ? (
            <div key={key} className="flex justify-between items-center py-2 border-b border-dark/5">
              <span className="text-xs text-dark/40 uppercase tracking-wider">{label}</span>
              <input
                className="text-sm text-dark font-medium text-right bg-transparent border-none outline-none focus:bg-cream rounded px-1 w-48"
                value={ft[key] ?? ''}
                onChange={(e) => update(key, e.target.value)}
              />
            </div>
          ) : (
            <Field key={key} label={label} value={ft[key]} />
          )
        ))}
      </div>

      <SectionTitle>Coloris</SectionTitle>
      <div className="grid grid-cols-2 gap-x-8">
        <Field label="Réf. coloris" value={ft.coloris_ref} mono />
        <Field label="Nom coloris" value={ft.coloris_nom} />
      </div>

      <SectionTitle>Entretien</SectionTitle>
      {canEdit ? (
        <div className="space-y-2">
          <p className="text-xs text-dark/40">Sélectionner les consignes applicables :</p>
          <div className="grid grid-cols-2 gap-2">
            {ENTRETIEN_OPTIONS.map((opt) => {
              const checked = (ft.entretien ?? []).includes(opt)
              return (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer hover:text-dark group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const current = ft.entretien ?? []
                      update('entretien', checked ? current.filter(e => e !== opt) : [...current, opt])
                    }}
                    className="rounded border-dark/20"
                  />
                  <span className={checked ? 'text-dark' : 'text-dark/50'}>{opt}</span>
                </label>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(ft.entretien ?? []).map((e, i) => (
            <span key={i} className="text-xs px-2.5 py-1 bg-cream rounded-full text-dark/60 border border-dark/8">{e}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Onglet 2 : FCM ────────────────────────────────────────────

function TabFCM({ data, onChange, canEdit }) {
  const lines = Array.isArray(data) ? data : []
  const [newLine, setNewLine] = useState(null)

  const updateLine = (idx, key, val) => {
    const next = lines.map((l, i) => i === idx ? { ...l, [key]: val } : l)
    onChange(next)
  }

  const addLine = () => {
    const next = [
      ...lines,
      { position: lines.length + 1, designation: '', matiere: '', ref: '', fournisseur: '', quantite: '', unite: 'ml', coloris: '', commentaire: '' },
    ]
    onChange(next)
    setNewLine(next.length - 1)
  }

  const removeLine = (idx) => onChange(lines.filter((_, i) => i !== idx))

  const COLS = ['Pos.', 'Désignation', 'Matière / Composition', 'Réf.', 'Fournisseur', 'Qté', 'U.', 'Coloris', 'Commentaire', '']

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-dark/50">{lines.length} ligne{lines.length > 1 ? 's' : ''} de composant</p>
        {canEdit && (
          <button onClick={addLine} className="btn-primary">
            <Plus size={14} /> Ajouter une ligne
          </button>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="py-12 text-center text-dark/30 text-sm">Aucun composant renseigné</div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-dark/5">
                {COLS.map((h) => (
                  <th key={h} className="text-left py-2.5 px-2 text-xs font-medium text-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/5">
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-cream/60 transition-colors group">
                  <td className="py-2.5 px-2 text-dark/40 text-xs">{line.position}</td>
                  {canEdit ? (
                    <>
                      {['designation', 'matiere', 'ref', 'fournisseur'].map((key) => (
                        <td key={key} className="py-2 px-2">
                          <input
                            className="w-full text-sm bg-transparent border-none outline-none focus:bg-white rounded px-1"
                            value={line[key] ?? ''}
                            onChange={(e) => updateLine(idx, key, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          className="w-16 text-sm bg-transparent border-none outline-none focus:bg-white rounded px-1 text-right"
                          value={line.quantite ?? ''}
                          onChange={(e) => updateLine(idx, 'quantite', e.target.value)}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          className="text-sm bg-transparent border-none outline-none"
                          value={line.unite ?? 'ml'}
                          onChange={(e) => updateLine(idx, 'unite', e.target.value)}
                        >
                          {['ml', 'pce', 'cm', 'kg', 'g', 'lot'].map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      {['coloris', 'commentaire'].map((key) => (
                        <td key={key} className="py-2 px-2">
                          <input
                            className="w-full text-sm bg-transparent border-none outline-none focus:bg-white rounded px-1"
                            value={line[key] ?? ''}
                            onChange={(e) => updateLine(idx, key, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="py-2 px-2">
                        <button
                          onClick={() => removeLine(idx)}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >✕</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 px-2 font-medium text-dark">{line.designation}</td>
                      <td className="py-2.5 px-2 text-dark/60 text-xs">{line.matiere}</td>
                      <td className="py-2.5 px-2 font-mono text-xs text-dark/50">{line.ref}</td>
                      <td className="py-2.5 px-2 text-dark/60">{line.fournisseur}</td>
                      <td className="py-2.5 px-2 text-right text-dark/70">{line.quantite}</td>
                      <td className="py-2.5 px-2 text-dark/40">{line.unite}</td>
                      <td className="py-2.5 px-2 text-dark/60">{line.coloris}</td>
                      <td className="py-2.5 px-2 text-dark/40 text-xs italic">{line.commentaire}</td>
                      <td />
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Onglet 3 : Mesures & Grading ──────────────────────────────

function TabMesures({ data }) {
  const d = data ?? {}
  const grading = d.grading ?? {}
  const tailles = Object.keys(grading)
  const points = d.points_mesure ?? []
  const tolerances = d.tolerances ?? {}

  if (!tailles.length) {
    return <div className="py-12 text-center text-dark/30 text-sm">Aucune donnée de grading renseignée</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-6 text-sm">
        <div><span className="text-dark/40 text-xs uppercase tracking-wider">Système</span><p className="font-medium mt-0.5">{d.systeme_taille ?? '—'}</p></div>
        <div><span className="text-dark/40 text-xs uppercase tracking-wider">Taille base</span><p className="font-medium mt-0.5">{d.taille_base ?? '—'}</p></div>
        <div><span className="text-dark/40 text-xs uppercase tracking-wider">Tailles</span><p className="font-medium mt-0.5">{tailles.join(' / ')}</p></div>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-dark/5 bg-cream/50">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dark/40 uppercase tracking-wider sticky left-0 bg-cream/50">Point</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dark/40 uppercase tracking-wider">Désignation</th>
              {tailles.map(t => (
                <th key={t} className="py-2.5 px-3 text-xs font-medium text-dark/60 uppercase tracking-wider text-right">
                  {t}
                  {d.taille_base === t && <span className="ml-1 text-gold">★</span>}
                </th>
              ))}
              <th className="py-2.5 px-3 text-xs font-medium text-dark/30 uppercase tracking-wider text-right">Tol. +/-</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark/5">
            {points.map((pt) => (
              <tr key={pt.code} className="hover:bg-cream/40 transition-colors">
                <td className="py-3 px-3 font-mono text-xs font-bold text-gold sticky left-0">{pt.code}</td>
                <td className="py-3 px-3 text-dark/70">{pt.nom}</td>
                {tailles.map(t => (
                  <td key={t} className={`py-3 px-3 text-right font-medium ${d.taille_base === t ? 'text-dark' : 'text-dark/60'}`}>
                    {grading[t]?.[pt.code] ?? '—'}
                  </td>
                ))}
                <td className="py-3 px-3 text-right text-xs text-dark/30">
                  {tolerances[pt.code] ? `+${tolerances[pt.code].plus} / -${tolerances[pt.code].minus}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-dark/30 italic">Toutes les valeurs sont en centimètres. ★ = taille de base</p>
    </div>
  )
}

// ── Onglet 4 : Prise de mesures ───────────────────────────────

function TabPriseMesures({ data }) {
  const d = data ?? {}
  const instructions = d.instructions ?? []

  return (
    <div className="space-y-6">
      {d.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 leading-relaxed">{d.notes}</p>
        </div>
      )}

      {instructions.length === 0 ? (
        <div className="py-12 text-center text-dark/30 text-sm">Aucune instruction de prise de mesure</div>
      ) : (
        <div className="space-y-3">
          {instructions.map((inst, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-dark/5 hover:border-dark/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gold">{inst.code}</span>
              </div>
              <p className="text-sm text-dark/70 leading-relaxed">{inst.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Onglet 5 : Commentaires ───────────────────────────────────

function TabCommentaires({ productId, data, onRefresh }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [zone, setZone] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [proto, setProto] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const comments = Array.isArray(data) ? data : []
  const open = comments.filter(c => c.statut === 'ouvert')
  const done = comments.filter(c => c.statut === 'traite')

  const mutation = useMutation({
    mutationFn: () => addComment(productId, { zone, commentaire, proto }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spec-sheet', productId] })
      setZone(''); setCommentaire(''); setProto(''); setFormOpen(false)
    },
  })

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const CommentCard = ({ c }) => (
    <div className={`p-4 rounded-xl border ${c.statut === 'ouvert' ? 'border-amber-200 bg-amber-50/50' : 'border-dark/5 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${c.statut === 'ouvert' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {c.zone && <span className="text-xs px-2 py-0.5 bg-dark/5 rounded-full text-dark/60 font-medium">{c.zone}</span>}
            {c.proto && <span className="text-xs px-2 py-0.5 bg-gold/10 rounded-full text-gold font-medium">{c.proto}</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.statut === 'ouvert' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {c.statut === 'ouvert' ? 'Ouvert' : 'Traité'}
            </span>
          </div>
          <p className="text-sm text-dark leading-relaxed">{c.commentaire}</p>
          <p className="text-xs text-dark/30 mt-1.5">{c.auteur} · {formatDate(c.date)}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div className="flex gap-3 text-sm">
          <span className="text-amber-600 font-medium">{open.length} ouvert{open.length > 1 ? 's' : ''}</span>
          <span className="text-dark/30">·</span>
          <span className="text-dark/40">{done.length} traité{done.length > 1 ? 's' : ''}</span>
        </div>
        <button onClick={() => setFormOpen(!formOpen)} className="btn-primary">
          <Plus size={14} /> Ajouter un commentaire
        </button>
      </div>

      {formOpen && (
        <div className="card p-4 border-2 border-gold/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Zone / Section</label>
              <input className="input-field mt-1" placeholder="Ex : Col, Manche, Fermeture…" value={zone} onChange={e => setZone(e.target.value)} />
            </div>
            <div>
              <label className="label">Proto</label>
              <input className="input-field mt-1" placeholder="Ex : P1, SMS, Concept…" value={proto} onChange={e => setProto(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Commentaire *</label>
            <textarea
              className="input-field mt-1 h-24 resize-none"
              placeholder="Décrire l'observation, la correction demandée ou la validation…"
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setFormOpen(false)} className="btn-ghost">Annuler</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!commentaire || mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending ? <Spinner size="xs" /> : <Plus size={14} />}
              Ajouter
            </button>
          </div>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="py-12 text-center text-dark/30 text-sm">Aucun commentaire de développement</div>
      ) : (
        <div className="space-y-6">
          {open.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 flex items-center gap-1.5"><AlertCircle size={12} /> Points ouverts</p>
              {open.map((c) => <CommentCard key={c.id} c={c} />)}
            </div>
          )}
          {done.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 flex items-center gap-1.5"><Check size={12} /> Validés / Traités</p>
              {done.map((c) => <CommentCard key={c.id} c={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Onglet 6 : Labelling ──────────────────────────────────────

function TabLabelling({ data }) {
  const d = data ?? {}
  const etiquettes = d.etiquettes ?? []

  return (
    <div className="space-y-6">
      {d.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 leading-relaxed">{d.notes}</p>
        </div>
      )}

      {etiquettes.length === 0 ? (
        <div className="py-12 text-center text-dark/30 text-sm">Aucune étiquette renseignée</div>
      ) : (
        <div className="space-y-3">
          {etiquettes.map((etq, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-start p-4 rounded-xl border border-dark/5 hover:border-dark/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-dark/5 flex items-center justify-center">
                <Tag size={14} className="text-dark/40" />
              </div>
              <div>
                <p className="text-xs text-dark/40 uppercase tracking-wider mb-0.5">Type</p>
                <p className="text-sm font-semibold text-dark">{etq.type}</p>
              </div>
              <div>
                <p className="text-xs text-dark/40 uppercase tracking-wider mb-0.5">Position</p>
                <p className="text-sm text-dark/70">{etq.position}</p>
              </div>
              <div className="text-right">
                {etq.obligatoire
                  ? <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">Obligatoire</span>
                  : <span className="text-xs px-2 py-0.5 bg-dark/5 text-dark/40 rounded-full">Optionnel</span>
                }
              </div>
              <div className="col-span-4 pl-12">
                <p className="text-xs text-dark/40 uppercase tracking-wider mb-0.5">Contenu</p>
                <p className="text-sm text-dark/60 italic">{etq.contenu}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Onglet 7 : Croquis ────────────────────────────────────────

function CroquisZone({ label, doc, onUpload, onDelete, canEdit }) {
  const inputRef = useRef()
  const [blobUrl, setBlobUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!doc) { setBlobUrl(null); return }
    const isImage = doc.mime_type?.startsWith('image/')
    if (!isImage) { setBlobUrl(null); return }
    const token = localStorage.getItem('plm_token')
    fetch(`/api/documents/${doc.id}/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(b => setBlobUrl(URL.createObjectURL(b)))
      .catch(() => {})
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [doc?.id])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try { await onUpload(file, label) } finally { setUploading(false) }
  }

  return (
    <div className="space-y-2">
      <p className="label">{label}</p>
      {blobUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-dark/10">
          <img src={blobUrl} alt={label} className="w-full aspect-[3/4] object-contain bg-cream/50" />
          {canEdit && (
            <div className="absolute inset-0 bg-dark/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button onClick={() => inputRef.current?.click()}
                className="bg-white text-dark rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 hover:bg-gold hover:text-white transition-colors">
                <Upload size={12} /> Remplacer
              </button>
              <button onClick={() => onDelete(doc.id)}
                className="bg-white text-red-600 rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 hover:bg-red-600 hover:text-white transition-colors">
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
          )}
        </div>
      ) : doc ? (
        <div className="rounded-xl border border-dark/10 p-4 flex items-center justify-between bg-cream/30">
          <div>
            <p className="text-sm font-medium text-dark">{doc.name}</p>
            <p className="text-xs text-dark/40 mt-0.5">{(doc.file_size_bytes / 1024).toFixed(0)} Ko</p>
          </div>
          <div className="flex gap-2">
            <a href={`/api/documents/${doc.id}/download`}
              onClick={e => { e.preventDefault(); window.open(`/api/documents/${doc.id}/download`) }}
              className="btn-ghost py-1.5 text-xs"><Download size={12} /> Télécharger</a>
            {canEdit && <button onClick={() => onDelete(doc.id)} className="btn-ghost py-1.5 text-xs text-red-500 hover:text-red-600"><Trash2 size={12} /></button>}
          </div>
        </div>
      ) : (
        <div onClick={() => canEdit && inputRef.current?.click()}
          className={`aspect-[3/4] rounded-xl border-2 border-dashed border-dark/10 flex flex-col items-center justify-center gap-3 bg-cream/50 transition-colors ${canEdit ? 'hover:border-gold/40 cursor-pointer' : ''}`}>
          {uploading ? <Spinner size="md" /> : (
            <>
              <Image size={32} className="text-dark/20" />
              <div className="text-center">
                <p className="text-sm text-dark/40">{label}</p>
                {canEdit && <p className="text-xs text-dark/25 mt-0.5">Cliquer pour uploader</p>}
              </div>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*,.pdf,.ai,.eps,.dxf" className="hidden" onChange={handleFileChange} />
    </div>
  )
}

function TabCroquis({ data, productId, canEdit }) {
  const qc = useQueryClient()
  const d = data ?? {}
  const details = d.details ?? []

  const { data: docs = [] } = useQuery({
    queryKey: ['documents', 'product', productId, 'croquis'],
    queryFn: () => apiClient.get('/documents', { params: { entity_type: 'product', entity_id: productId } }).then(r => r.data.filter(d => d.type === 'croquis')),
    enabled: !!productId,
  })

  const faceDoc = docs.find(d => d.notes === 'face') ?? null
  const dosDoc  = docs.find(d => d.notes === 'dos')  ?? null
  const extraDocs = docs.filter(d => d.notes !== 'face' && d.notes !== 'dos')

  const handleUpload = async (file, label) => {
    const view = label === 'Vue face' ? 'face' : label === 'Vue dos' ? 'dos' : 'detail'
    const form = new FormData()
    form.append('file', file)
    form.append('entity_type', 'product')
    form.append('entity_id', productId)
    form.append('type', 'croquis')
    form.append('notes', view)
    await apiClient.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    qc.invalidateQueries(['documents', 'product', productId, 'croquis'])
  }

  const handleDelete = async (docId) => {
    await apiClient.delete(`/documents/${docId}`)
    qc.invalidateQueries(['documents', 'product', productId, 'croquis'])
  }

  return (
    <div className="space-y-6">
      {d.description && (
        <div>
          <p className="label mb-1">Description du croquis</p>
          <p className="text-sm text-dark/70 leading-relaxed">{d.description}</p>
        </div>
      )}
      {d.notes && (
        <div className="bg-cream border border-dark/8 rounded-xl p-4">
          <p className="text-xs text-dark/40 uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm text-dark/60 italic">{d.notes}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <CroquisZone label="Vue face" doc={faceDoc} onUpload={handleUpload} onDelete={handleDelete} canEdit={canEdit} />
        <CroquisZone label="Vue dos"  doc={dosDoc}  onUpload={handleUpload} onDelete={handleDelete} canEdit={canEdit} />
      </div>

      {extraDocs.length > 0 && (
        <div>
          <p className="label mb-3">Autres fichiers</p>
          <div className="space-y-2">
            {extraDocs.map(doc => (
              <CroquisZone key={doc.id} label={doc.name} doc={doc} onUpload={handleUpload} onDelete={handleDelete} canEdit={canEdit} />
            ))}
          </div>
        </div>
      )}

      {canEdit && (
        <div>
          <CroquisZone label="Ajouter un fichier" doc={null} onUpload={(f) => handleUpload(f, 'detail')} onDelete={handleDelete} canEdit={canEdit} />
        </div>
      )}

      {details.length > 0 && (
        <div>
          <SectionTitle>Détails techniques</SectionTitle>
          <div className="space-y-2">
            {details.map((det, i) => (
              <div key={i} className="flex gap-3 items-start py-3 border-b border-dark/5 last:border-0">
                <ChevronRight size={14} className="text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-dark">{det.label}</p>
                  <p className="text-sm text-dark/50 mt-0.5">{det.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────

export default function SpecSheetPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('fiche')
  const [localData, setLocalData] = useState(null)
  const [saved, setSaved] = useState(false)

  const canEdit = CAN_EDIT.includes(user?.role)

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
  })

  const { data: sheet, isLoading: loadingSheet } = useQuery({
    queryKey: ['spec-sheet', id],
    queryFn: () => getSpecSheet(id),
    retry: false,
    onSuccess: (d) => setLocalData(d),
  })

  const saveMutation = useMutation({
    mutationFn: (data) => saveSpecSheet(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spec-sheet', id] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const sheetData = localData ?? sheet ?? {}

  const updateSection = (section, value) => {
    const next = { ...sheetData, [section]: value }
    setLocalData(next)
    setSaved(false)
  }

  const handleSave = () => {
    const { fiche_technique, fcm, mesures, prise_mesures, commentaires, labelling, croquis } = sheetData
    saveMutation.mutate({ fiche_technique, fcm, mesures, prise_mesures, commentaires, labelling, croquis })
  }

  if (loadingProduct || loadingSheet) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  }

  const STATUS_SECTION = {
    fiche:        'fiche_technique',
    fcm:          'fcm',
    mesures:      'mesures',
    prise:        'prise_mesures',
    commentaires: 'commentaires',
    labelling:    'labelling',
    croquis:      'croquis',
  }

  const renderTab = () => {
    switch (tab) {
      case 'fiche':        return <TabFicheTechnique data={sheetData.fiche_technique} onChange={v => updateSection('fiche_technique', v)} canEdit={canEdit} />
      case 'fcm':          return <TabFCM data={sheetData.fcm} onChange={v => updateSection('fcm', v)} canEdit={canEdit} />
      case 'mesures':      return <TabMesures data={sheetData.mesures} />
      case 'prise':        return <TabPriseMesures data={sheetData.prise_mesures} />
      case 'commentaires': return <TabCommentaires productId={id} data={sheetData.commentaires} />
      case 'labelling':    return <TabLabelling data={sheetData.labelling} />
      case 'croquis':      return <TabCroquis data={sheetData.croquis} productId={id} canEdit={canEdit} />
      default: return null
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to={`/products/${id}`} className="btn-ghost -ml-1 text-dark/50">
          <ArrowLeft size={14} />
          {product?.name ?? 'Produit'}
        </Link>
        <ChevronRight size={14} className="text-dark/20" />
        <span className="text-sm text-dark/40">Fiche technique</span>
      </div>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-dark/30 uppercase tracking-wider">{product?.reference}</span>
              {sheetData.version && (
                <span className="text-xs px-2 py-0.5 bg-dark/5 rounded-full text-dark/40">v{sheetData.version}</span>
              )}
            </div>
            <h2 className="font-serif text-2xl text-dark">{product?.name}</h2>
            <p className="text-sm text-dark/40 mt-0.5">{product?.collection_name} · {sheetData.fiche_technique?.saison ?? ''}</p>
          </div>
          {canEdit && (
            <SaveButton onClick={handleSave} saving={saveMutation.isPending} saved={saved} />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 bg-white border border-dark/5 rounded-xl p-1 shadow-card overflow-x-auto">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button key={tid} onClick={() => setTab(tid)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === tid ? 'bg-gold text-white shadow-sm' : 'text-dark/50 hover:text-dark hover:bg-dark/5'
              }`}>
              <Icon size={13} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        <div className="card p-6 mt-3">
          {renderTab()}
        </div>
      </div>
    </div>
  )
}
