import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, AlertCircle, Info, TrendingDown, Undo2, Search } from 'lucide-react'
import { getAllReturnInsights } from '../api/returns.api'
import Spinner from '../components/ui/Spinner'
import { PRODUCT_TYPE_LABELS } from '../utils/status'

const SEVERITY = {
  critical: { icon: AlertTriangle, badge: 'bg-red-50 text-red-600 border-red-100', label: 'Critique' },
  warning: { icon: AlertCircle, badge: 'bg-amber-50 text-amber-700 border-amber-100', label: 'À surveiller' },
  info: { icon: Info, badge: 'bg-blue-50 text-blue-600 border-blue-100', label: 'Info' },
}
const fmtInt = (n) => new Intl.NumberFormat('fr-FR').format(n)

export default function ReturnsPage() {
  const [search, setSearch] = useState('')
  const { data: insights, isLoading } = useQuery({
    queryKey: ['returns', 'all'],
    queryFn: getAllReturnInsights,
  })

  const filtered = (insights ?? []).filter((i) => {
    if (!search) return true
    const s = search.toLowerCase()
    return [i.attribute, i.reason, i.family, i.sub_family, i.recommendation]
      .filter(Boolean).some((v) => v.toLowerCase().includes(s))
  })

  const avgRate = insights?.length
    ? (insights.reduce((s, i) => s + Number(i.return_rate), 0) / insights.length).toFixed(1)
    : null
  const criticalCount = insights?.filter((i) => i.severity === 'critical').length ?? 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="font-serif text-2xl text-dark">Retours clients</h2>
        <p className="text-dark/40 text-sm mt-1">
          Base de connaissance des motifs de retour — exploitée automatiquement à la création des fiches produit.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-3"><Undo2 size={18} /></div>
          <p className="text-2xl font-semibold text-dark leading-none">{insights?.length ?? 0}</p>
          <p className="text-xs text-dark/50 mt-1.5">Signaux répertoriés</p>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-3"><TrendingDown size={18} /></div>
          <p className="text-2xl font-semibold text-dark leading-none">{avgRate != null ? `${avgRate}%` : '—'}</p>
          <p className="text-xs text-dark/50 mt-1.5">Taux de retour moyen</p>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3"><AlertTriangle size={18} /></div>
          <p className="text-2xl font-semibold text-dark leading-none">{criticalCount}</p>
          <p className="text-xs text-dark/50 mt-1.5">Signaux critiques</p>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un attribut, une famille, un motif…"
          className="input-field pl-9 w-full" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card py-12 text-center text-dark/30 text-sm">Aucun signal de retour trouvé.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ins) => {
            const S = SEVERITY[ins.severity] ?? SEVERITY.info
            const scope = [ins.scope_type ? PRODUCT_TYPE_LABELS[ins.scope_type] : null, ins.family, ins.sub_family].filter(Boolean).join(' · ') || 'Tous produits'
            return (
              <div key={ins.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${S.badge}`}><S.icon size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-dark">{ins.attribute}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${S.badge}`}>{S.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark/5 text-dark/50">{scope}</span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-500 ml-auto"><TrendingDown size={12} /> {ins.return_rate}%</span>
                    </div>
                    <p className="text-xs text-dark/50 mt-1">
                      {ins.reason}
                      {ins.sample_size > 0 && <span className="text-dark/30"> · {fmtInt(ins.sample_size)} commandes analysées</span>}
                    </p>
                    <p className="text-xs text-dark/70 mt-2 leading-relaxed bg-cream rounded-lg px-3 py-2">
                      <span className="text-gold font-medium">Recommandation → </span>{ins.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
