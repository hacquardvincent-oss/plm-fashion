import {
  COLLECTION_STATUS_LABELS,
  COLLECTION_STATUS_STYLES,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_STYLES,
  PRODUCT_TYPE_LABELS,
} from '../../utils/status'

const ALL_LABELS = { ...COLLECTION_STATUS_LABELS, ...PRODUCT_STATUS_LABELS, ...PRODUCT_TYPE_LABELS }
const ALL_STYLES = { ...COLLECTION_STATUS_STYLES, ...PRODUCT_STATUS_STYLES }

export default function Badge({ status, label, className = '' }) {
  const displayLabel = label ?? ALL_LABELS[status] ?? status
  const style = ALL_STYLES[status] ?? 'bg-dark/5 text-dark/60'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}
    >
      {displayLabel}
    </span>
  )
}
