// client/src/pages/PurchaseDetailPage.jsx
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, ChevronRight, Package, Truck, CheckCircle,
  AlertTriangle, Clock, Edit2, Save, X, Plus
} from 'lucide-react'
import { getPurchase, updatePurchase, receiveLine } from '../api/purchases.api'
import Spinner from '../components/ui/Spinner'

const STATUSES = [
  { id: 'draft',              label: 'Brouillon',         color: 'bg-dark/5 text-dark/50' },
  { id: 'sent',               label: 'Envoyé',            color: 'bg-blue-50 text-blue-600' },
  { id: 'confirmed',          label: 'Confirmé',          color: 'bg-amber-50 text-amber-600' },
  { id: 'in_production',      label: 'En production',     color: 'bg-purple-50 text-purple-600' },
  { id: 'shipped',            label: 'Expédié',           color: 'bg-indigo-50 text-indigo-600' },
  { id: 'partially_received', label: 'Partiellement reçu', color: 'bg-orange-50 text-orange-600' },
  { id: 'received',           label: 'Reçu',              color: 'bg-emerald-50 text-emerald-600' },
  { id: 'validated',          label: 'Validé',            color: 'bg-emerald-100 text-emerald-700' },
  { id: 'cancelled',          label: 'Annulé',            color: 'bg-red-50 text-red-400' },
]

const QUALITY = {
  pending:  { label: 'En attente', color: 'bg-dark/5 text-dark/50' },
  ok:       { label: 'Conforme',   color: 'bg-emerald-50 text-emerald-600' },
  nc:       { label: 'Non-conforme', color: 'bg-red-50 text-red-600' },
  analysis: { label: 'En analyse', color: 'bg-amber-50 text-amber-600' },
}

function Field({ label, value, mono }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-dark/5">
      <span className="text-xs text-dark/40 uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-dark font-medium text-right ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  )
}

function ReceiveModal({ line, onClose, onSave }) {
  const [qty, setQty] = useState(String(line.quantity_ordered - line.quantity_received))
  const [quality, setQuality] = useState('ok')
  return (
    <div className="fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-dark">Réceptionner la ligne</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
        </div>
        <p className="text-sm text-dark/60">{line.designation || line.material_name} — {line.coloris}</p>
        <div>
          <label className="label">Quantité reçue</label>
          <input type="number" className="input-field mt-1" value={qty} onChange={e => setQty(e.target.value)}
            max={line.quantity_ordered} min={0} step="0.01" />
          <p className="text-xs text-dark/40 mt-1">Commandé : {line.quantity_ordered} {line.unit}</p>
        </div>
        <div>
          <label className="label">Contrôle qualité</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {Object.entries(QUALITY).map(([k, v]) => (
              <button key={k} onClick={() => setQuality(k)}
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                  quality === k ? 'border-gold bg-gold/10 text-gold' : 'border-dark/10 text-dark/50'
                }`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost">Annuler</button>
          <button onClick={() => onSave(Number(qty), quality)} className="btn-primary">
            <CheckCircle size={14} /> Confirmer réception
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PurchaseDetailPage({ isNew = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editStatus, setEditStatus] = useState(false)
  const [receivingLine, setReceivingLine] = useState(null)

  const { data: po, isLoading, isError } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => getPurchase(id),
    retry: 1,
    enabled: !isNew,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => updatePurchase(id, data),
    onSuccess: () => { qc.invalidateQueries(['purchase', id]); qc.invalidateQueries(['purchases']); setEditStatus(false) },
  })

  const receiveMutation = useMutation({
    mutationFn: ({ lineId, qty, quality }) => receiveLine(lineId, { quantity_received: qty, quality_status: quality }),
    onSuccess: () => { qc.invalidateQueries(['purchase', id]); setReceivingLine(null) },
  })

  if (isNew) return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/purchases')} className="btn-ghost -ml-1 text-dark/50">
          <ArrowLeft size={14} /> Achats
        </button>
      </div>
      <div className="card p-8 text-center space-y-3">
        <h2 className="font-serif text-xl text-dark">Nouveau bon de commande</h2>
        <p className="text-sm text-dark/40">La création de BC sera disponible prochainement.</p>
        <button onClick={() => navigate('/purchases')} className="btn-secondary">Retour à la liste</button>
      </div>
    </div>
  )

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (isError) return (
    <div className="text-center py-24 space-y-3">
      <p className="text-dark/40">Impossible de charger ce bon de commande.</p>
      <button onClick={() => navigate('/purchases')} className="btn-ghost">← Retour aux achats</button>
    </div>
  )
  if (!po) return <div className="text-center py-24 text-dark/40">Bon de commande introuvable</div>

  const currentStatus = STATUSES.find(s => s.id === po.status) || STATUSES[0]
  const totalRecu = po.lines?.reduce((s, l) => s + Number(l.quantity_received), 0) || 0
  const totalCommande = po.lines?.reduce((s, l) => s + Number(l.quantity_ordered), 0) || 0
  const pctRecu = totalCommande > 0 ? Math.round(totalRecu / totalCommande * 100) : 0

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
  const fmtMoney = (n) => n ? Number(n).toLocaleString('fr-FR') + ' €' : '—'

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/purchases" className="btn-ghost -ml-1 text-dark/50">
          <ArrowLeft size={14} /> Achats
        </Link>
        <ChevronRight size={14} className="text-dark/20" />
        <span className="text-dark/40 font-mono">{po.reference}</span>
      </div>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-dark/30 uppercase tracking-wider">{po.reference}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            </div>
            <h2 className="font-serif text-2xl text-dark">{po.supplier_name || 'Fournisseur non défini'}</h2>
            <p className="text-sm text-dark/40 mt-0.5">
              {po.collection_name && <span>{po.collection_name} · </span>}
              Créé par {po.created_by_name} · {fmtDate(po.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditStatus(!editStatus)} className="btn-ghost">
              <Edit2 size={13} /> Modifier statut
            </button>
          </div>
        </div>

        {/* Changer statut */}
        {editStatus && (
          <div className="mt-4 pt-4 border-t border-dark/5">
            <p className="label mb-2">Passer au statut :</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.filter(s => s.id !== po.status && s.id !== 'cancelled').map(s => (
                <button key={s.id} onClick={() => updateMutation.mutate({ status: s.id })}
                  className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-all hover:scale-105 ${s.color}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progression réception */}
        {totalCommande > 0 && (
          <div className="mt-4 pt-4 border-t border-dark/5">
            <div className="flex items-center justify-between text-xs text-dark/40 mb-1.5">
              <span>Réception globale</span>
              <span>{pctRecu}% reçu</span>
            </div>
            <div className="h-2 bg-dark/5 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pctRecu}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Infos générales */}
        <div className="card p-5 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">Informations</p>
          <Field label="Fournisseur" value={po.supplier_name} />
          <Field label="Collection" value={po.collection_name} />
          <Field label="Date commande" value={fmtDate(po.order_date)} />
          <Field label="Livraison prévue" value={fmtDate(po.expected_delivery)} />
          <Field label="Livraison réelle" value={fmtDate(po.actual_delivery)} />
          <Field label="Transporteur" value={po.carrier} />
          <Field label="N° suivi" value={po.tracking_number} mono />
          <Field label="Montant total" value={fmtMoney(po.lines?.reduce((s,l) => s + l.quantity_ordered * (l.unit_price||0), 0))} />
          {po.notes && (
            <div className="mt-3 pt-3 border-t border-dark/5">
              <p className="text-xs text-dark/40 mb-1">Notes</p>
              <p className="text-sm text-dark/70 leading-relaxed">{po.notes}</p>
            </div>
          )}
        </div>

        {/* Lignes de commande */}
        <div className="md:col-span-2 card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
            Lignes de commande ({po.lines?.length || 0})
          </p>
          {!po.lines?.length ? (
            <div className="py-8 text-center text-dark/30 text-sm">Aucune ligne</div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-dark/5">
                    {['Désignation','Coloris','Commandé','Reçu','P.U.','Total','Qualité',''].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-medium text-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark/5">
                  {po.lines.map(line => {
                    const qCfg = QUALITY[line.quality_status] || QUALITY.pending
                    const total = Number(line.quantity_ordered) * Number(line.unit_price || 0)
                    const isFullyReceived = Number(line.quantity_received) >= Number(line.quantity_ordered)
                    return (
                      <tr key={line.id} className="hover:bg-cream/60 transition-colors group">
                        <td className="py-3 px-2">
                          <p className="font-medium text-dark">{line.designation || line.material_name || '—'}</p>
                          {line.product_name && <p className="text-xs text-dark/40">{line.product_name}</p>}
                        </td>
                        <td className="py-3 px-2 text-dark/60">{line.coloris || '—'}</td>
                        <td className="py-3 px-2 text-right font-medium text-dark">{line.quantity_ordered} {line.unit}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={isFullyReceived ? 'text-emerald-600 font-medium' : 'text-dark/60'}>
                            {line.quantity_received} {line.unit}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-dark/60">
                          {line.unit_price ? Number(line.unit_price).toLocaleString('fr-FR') + ' €' : '—'}
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-dark">
                          {total > 0 ? total.toLocaleString('fr-FR') + ' €' : '—'}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${qCfg.color}`}>
                            {qCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {!isFullyReceived && po.status !== 'cancelled' && (
                            <button
                              onClick={() => setReceivingLine(line)}
                              className="text-xs text-gold hover:text-gold/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Réceptionner
                            </button>
                          )}
                          {isFullyReceived && <CheckCircle size={14} className="text-emerald-500" />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal réception */}
      {receivingLine && (
        <ReceiveModal
          line={receivingLine}
          onClose={() => setReceivingLine(null)}
          onSave={(qty, quality) => receiveMutation.mutate({ lineId: receivingLine.id, qty, quality })}
        />
      )}
    </div>
  )
}
