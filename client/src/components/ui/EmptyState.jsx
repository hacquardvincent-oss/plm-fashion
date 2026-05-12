export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-gold-subtle flex items-center justify-center mb-4">
          <Icon size={22} className="text-gold" />
        </div>
      )}
      <p className="font-serif text-lg text-dark mb-1">{title}</p>
      {description && <p className="text-sm text-dark/40 mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
