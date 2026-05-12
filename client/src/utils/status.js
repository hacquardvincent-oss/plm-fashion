export const COLLECTION_STATUS_LABELS = {
  brouillon: 'Brouillon',
  en_cours: 'En cours',
  validee: 'Validée',
  archivee: 'Archivée',
}

export const PRODUCT_STATUS_LABELS = {
  concept: 'Concept',
  en_developpement: 'En développement',
  proto_1: 'Proto 1',
  proto_2: 'Proto 2',
  sms: 'SMS',
  valide: 'Validé',
  abandonne: 'Abandonné',
  archive: 'Archivé',
}

export const PRODUCT_TYPE_LABELS = {
  pret_a_porter: 'Prêt-à-porter',
  maroquinerie: 'Maroquinerie',
  accessoire: 'Accessoire',
}

export const ROLE_LABELS = {
  admin: 'Admin',
  directeur_artistique: 'Directeur artistique',
  chef_produit: 'Chef produit',
  acheteur: 'Acheteur',
  qualite: 'Qualité',
  direction: 'Direction',
  fournisseur: 'Fournisseur',
}

export const COLLECTION_STATUS_STYLES = {
  brouillon: 'bg-dark/5 text-dark/60',
  en_cours: 'bg-blue-50 text-blue-700',
  validee: 'bg-emerald-50 text-emerald-700',
  archivee: 'bg-dark/5 text-dark/40',
}

export const PRODUCT_STATUS_STYLES = {
  concept: 'bg-purple-50 text-purple-700',
  en_developpement: 'bg-blue-50 text-blue-700',
  proto_1: 'bg-amber-50 text-amber-700',
  proto_2: 'bg-amber-50 text-amber-700',
  sms: 'bg-orange-50 text-orange-700',
  valide: 'bg-emerald-50 text-emerald-700',
  abandonne: 'bg-red-50 text-red-600',
  archive: 'bg-dark/5 text-dark/40',
}

export const COLLECTION_STATUS_BAR = {
  brouillon: 'bg-dark/20',
  en_cours: 'bg-blue-400',
  validee: 'bg-emerald-400',
  archivee: 'bg-dark/10',
}

export const formatCurrency = (value, currency = 'EUR') => {
  if (value == null) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}
