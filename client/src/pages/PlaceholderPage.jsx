import { Construction } from 'lucide-react'

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-gold-subtle flex items-center justify-center mb-5">
        <Construction size={24} className="text-gold" />
      </div>
      <h2 className="font-serif text-2xl text-dark mb-2">{title}</h2>
      <p className="text-dark/40 text-sm max-w-xs">{description ?? 'Ce module est en cours de développement.'}</p>
    </div>
  )
}
