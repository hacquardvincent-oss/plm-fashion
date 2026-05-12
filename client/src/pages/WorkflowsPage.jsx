import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { GitMerge, CheckCircle, XCircle } from 'lucide-react'
import { getWorkflows, decideWorkflow } from '../api/workflows.api'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { formatDate } from '../utils/status'
import { useAuth } from '../hooks/useAuth'

const FILTERS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'approuve', label: 'Approuvés' },
  { value: 'rejete', label: 'Rejetés' },
  { value: '', label: 'Tous' },
]

const DECISION_STYLES = {
  en_attente: 'bg-amber-50 text-amber-700 border-amber-100',
  approuve: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejete: 'bg-red-50 text-red-600 border-red-100',
  revision: 'bg-blue-50 text-blue-700 border-blue-100',
}
const DECISION_LABELS = { en_attente: 'En attente', approuve: 'Approuvé', rejete: 'Rejeté', revision: 'Révision' }

const CAN_DECIDE = ['admin', 'chef_produit', 'direction', 'qualite']

export default function WorkflowsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [filter, setFilter] = useState('en_attente')

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows', filter],
    queryFn: () => getWorkflows(filter ? { decision: filter } : {}),
  })

  const decideMutation = useMutation({
    mutationFn: ({ id, decision }) => decideWorkflow(id, { decision }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white border border-dark/10 rounded-lg p-1 w-fit">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === f.value ? 'bg-gold text-white shadow-sm' : 'text-dark/50 hover:text-dark hover:bg-dark/5'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : !workflows?.length ? (
        <EmptyState
          icon={GitMerge}
          title="Aucun workflow"
          description={filter === 'en_attente' ? 'Aucune validation en attente.' : 'Aucun résultat pour ce filtre.'}
        />
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => (
            <div key={w.id} className={`card p-5 border-l-4 ${DECISION_STYLES[w.decision] ?? 'border-dark/10'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${DECISION_STYLES[w.decision]}`}>
                      {DECISION_LABELS[w.decision] ?? w.decision}
                    </span>
                    <span className="text-xs text-dark/40 capitalize">{w.stage?.replace('_', ' ')}</span>
                  </div>

                  <Link to={`/products/${w.product_id}`}
                    className="text-base font-medium text-dark hover:text-gold transition-colors block truncate">
                    {w.product_name ?? 'Produit'}
                  </Link>

                  <p className="text-xs text-dark/40 mt-1">
                    Demandé par <span className="font-medium">{w.requested_by_name ?? '—'}</span>
                    {' · '}{formatDate(w.requested_at)}
                    {w.due_date && (
                      <span className="text-orange-500 ml-2">· Échéance {formatDate(w.due_date)}</span>
                    )}
                  </p>

                  {w.comments && (
                    <p className="text-xs text-dark/50 mt-2 italic">"{w.comments}"</p>
                  )}
                </div>

                {w.decision === 'en_attente' && CAN_DECIDE.includes(user?.role) && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => decideMutation.mutate({ id: w.id, decision: 'approuve' })}
                      disabled={decideMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <CheckCircle size={13} /> Approuver
                    </button>
                    <button
                      onClick={() => decideMutation.mutate({ id: w.id, decision: 'rejete' })}
                      disabled={decideMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <XCircle size={13} /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
