import { Link } from 'react-router-dom'
import { Package, CalendarDays, ArrowRight } from 'lucide-react'
import Badge from '../ui/Badge'
import {
  COLLECTION_STATUS_BAR,
  formatCurrency,
  formatDate,
} from '../../utils/status'

export default function CollectionCard({ collection }) {
  const {
    id, code, name, season, year, status,
    product_count, budget, delivery_date, created_by_name,
  } = collection

  return (
    <Link
      to={`/collections/${id}`}
      className="card block overflow-hidden hover:shadow-card-hover transition-shadow duration-200 group"
    >
      {/* Status bar */}
      <div className={`h-1 w-full ${COLLECTION_STATUS_BAR[status] ?? 'bg-dark/10'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-dark/40 uppercase tracking-wider">{code}</span>
              <Badge status={status} />
            </div>
            <h3 className="font-serif text-base text-dark truncate group-hover:text-gold transition-colors">
              {name}
            </h3>
            <p className="text-xs text-dark/40 mt-0.5">
              {season} {year}
            </p>
          </div>
          <ArrowRight
            size={15}
            className="text-dark/20 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cream rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-dark/40 mb-0.5">
              <Package size={11} />
              <span className="text-xs uppercase tracking-wider">Références</span>
            </div>
            <p className="text-sm font-semibold text-dark">{product_count ?? 0}</p>
          </div>
          <div className="bg-cream rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-dark/40 mb-0.5">
              <span className="text-xs uppercase tracking-wider">Budget</span>
            </div>
            <p className="text-sm font-semibold text-dark">
              {budget ? formatCurrency(budget) : '—'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-dark/5">
          <CalendarDays size={11} className="text-dark/30" />
          <span className="text-xs text-dark/40">
            Livraison : {formatDate(delivery_date)}
          </span>
        </div>
      </div>
    </Link>
  )
}
