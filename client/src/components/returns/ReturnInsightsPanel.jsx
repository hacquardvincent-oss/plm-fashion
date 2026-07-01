import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, AlertCircle, Info, TrendingDown, Sparkles } from 'lucide-react'
import { getReturnInsights } from '../../api/returns.api'

const SEVERITY = {
  critical: { icon: AlertTriangle, badge: 'bg-red-50 text-red-600 border-red-100', dot: 'bg-red-500', label: 'Critique' },
  warning: { icon: AlertCircle, badge: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500', label: 'À surveiller' },
  info: { icon: Info, badge: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-400', label: 'Info' },
}

const fmtInt = (n) => new Intl.NumberFormat('fr-FR').format(n)

/**
 * Panneau de recommandations issues de l'historique de retours.
 * Se base sur type / family / subFamily de la fiche en cours.
 */
export default function ReturnInsightsPanel({ type, family, subFamily, compact = false }) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['returns', 'insights', type, family, subFamily],
    queryFn: () => getReturnInsights({ type, family, sub_family: subFamily }),
    enabled: !!type || !!family,
  })

  if (isLoading) return null
  if (!insights || insights.length === 0) return null

  const top = compact ? insights.slice(0, 3) : insights

  return (
    <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
          <Sparkles size={15} className="text-gold" />
        </div>
        <h3 className="font-serif text-base text-dark">Recommandations retours clients</h3>
      </div>
      <p className="text-xs text-dark/40 mb-4 ml-9">
        Analyse de l'historique de retours pour ce type de produit — {insights.length} signal{insights.length > 1 ? 'aux' : ''} détecté{insights.length > 1 ? 's' : ''}.
      </p>

      <div className="space-y-2.5">
        {top.map((ins) => {
          const S = SEVERITY[ins.severity] ?? SEVERITY.info
          return (
            <div key={ins.id} className="bg-white rounded-lg border border-dark/5 p-3.5">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${S.badge} border`}>
                  <S.icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-dark">{ins.attribute}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${S.badge}`}>{S.label}</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                      <TrendingDown size={12} /> {ins.return_rate}% retours
                    </span>
                  </div>
                  <p className="text-xs text-dark/50 mt-0.5">
                    {ins.reason}
                    {ins.sample_size > 0 && <span className="text-dark/30"> · {fmtInt(ins.sample_size)} commandes analysées</span>}
                  </p>
                  <p className="text-xs text-dark/70 mt-2 leading-relaxed">
                    <span className="text-gold font-medium">→ </span>{ins.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
