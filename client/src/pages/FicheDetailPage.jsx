import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Download, RefreshCw, Save, Copy, Check,
  FileText, ShoppingBag, Globe, Code2, Sparkles,
} from 'lucide-react'
import { getProduct } from '../api/products.api'
import { getFiche, generateFiche, updateFiche, exportFicheUrl } from '../api/fiches.api'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'

const TABS = [
  { id: 'wholesale', label: 'Wholesale', icon: FileText },
  { id: 'ecom_fr',   label: 'E-commerce FR', icon: ShoppingBag },
  { id: 'ecom_en',   label: 'E-commerce EN', icon: Globe },
  { id: 'geo',       label: 'GEO', icon: Sparkles },
  { id: 'jsonld',    label: 'JSON-LD', icon: Code2 },
]

function CharCount({ value, max, className = '' }) {
  const n = (value ?? '').length
  const over = n > max
  return (
    <span className={`text-xs tabular-nums ${over ? 'text-red-500 font-medium' : 'text-dark/30'} ${className}`}>
      {n}/{max}
    </span>
  )
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800) }}
      className="btn-ghost p-1.5 text-dark/30 hover:text-gold">
      {done ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

function FieldLabel({ children, hint }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <p className="label">{children}</p>
      {hint && <span className="text-xs text-dark/30">{hint}</span>}
    </div>
  )
}

function TagList({ value, onChange }) {
  const tags = Array.isArray(value) ? value : []
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-gold/10 text-gold-dark text-xs rounded-full">
            {t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-red-500">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Ajouter un mot-clé…" className="input-field py-1.5 text-xs flex-1" />
        <button onClick={add} className="btn-secondary text-xs py-1.5">+</button>
      </div>
    </div>
  )
}

function FaqEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : []
  const update = (i, field, val) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: val } : item)
    onChange(next)
  }
  const add = () => onChange([...items, { q: '', a: '' }])
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-dark/8 rounded-lg p-3 space-y-2 bg-white">
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-dark/40 mt-2 w-4 shrink-0">Q</span>
            <input value={item.q} onChange={(e) => update(i, 'q', e.target.value)}
              placeholder="Question…" className="input-field py-1.5 text-sm flex-1" />
            <button onClick={() => remove(i)} className="text-dark/20 hover:text-red-400 mt-2 text-xs">✕</button>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-dark/40 mt-2 w-4 shrink-0">R</span>
            <textarea value={item.a} onChange={(e) => update(i, 'a', e.target.value)}
              placeholder="Réponse…" rows={2}
              className="input-field py-1.5 text-sm flex-1 resize-none" />
          </div>
        </div>
      ))}
      <button onClick={add} className="btn-ghost text-xs text-dark/40 hover:text-gold">+ Ajouter une question</button>
    </div>
  )
}

function JsonBlock({ value }) {
  if (!value) return <span className="text-dark/25 text-xs italic">—</span>
  const parsed = typeof value === 'string' ? (() => { try { return JSON.parse(value) } catch { return value } })() : value
  const str = JSON.stringify(parsed, null, 2)
  return (
    <div className="relative">
      <div className="absolute top-2 right-2"><CopyBtn text={str} /></div>
      <pre className="bg-dark/3 border border-dark/8 rounded-lg p-4 text-xs font-mono text-dark/70 overflow-x-auto whitespace-pre leading-relaxed pr-10">{str}</pre>
    </div>
  )
}

function TabGeo({ fields, onChange }) {
  return (
    <div className="space-y-8">
      {/* Blurbs */}
      <section>
        <h3 className="text-xs font-semibold text-dark/40 uppercase tracking-wider mb-4">Blurb factuel (citation IA)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['fr', 'en'].map((l) => (
            <div key={l}>
              <div className="flex items-center justify-between mb-1">
                <FieldLabel>{l === 'fr' ? 'Blurb FR' : 'Blurb EN'}</FieldLabel>
                <CopyBtn text={fields[`geo_blurb_${l}`] ?? ''} />
              </div>
              <textarea
                value={fields[`geo_blurb_${l}`] ?? ''}
                onChange={(e) => onChange(`geo_blurb_${l}`, e.target.value)}
                rows={4}
                className="input-field w-full resize-none text-sm leading-relaxed"
                placeholder={l === 'fr' ? 'Description factuelle pour moteurs IA…' : 'Factual description for AI engines…'}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-dark/30 mt-2 leading-relaxed">
          Ce texte est optimisé pour être cité par ChatGPT, Perplexity ou Gemini. Il doit être factuel, sans superlatif et riche en entités nommées.
        </p>
      </section>

      {/* Alternate titles */}
      <section>
        <h3 className="text-xs font-semibold text-dark/40 uppercase tracking-wider mb-4">Titres alternatifs (synonymes)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['fr', 'en'].map((l) => (
            <div key={l}>
              <FieldLabel>{l === 'fr' ? 'Titres alternatifs FR' : 'Alternate titles EN'}</FieldLabel>
              <TagList value={fields[`alternate_titles_${l}`]} onChange={(v) => onChange(`alternate_titles_${l}`, v)} />
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section>
        <h3 className="text-xs font-semibold text-dark/40 uppercase tracking-wider mb-4">Cas d'usage / Occasions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['fr', 'en'].map((l) => (
            <div key={l}>
              <FieldLabel>{l === 'fr' ? 'Cas d\'usage FR' : 'Use cases EN'}</FieldLabel>
              <TagList value={fields[`use_cases_${l}`]} onChange={(v) => onChange(`use_cases_${l}`, v)} />
            </div>
          ))}
        </div>
      </section>

      {/* Entities */}
      <section>
        <h3 className="text-xs font-semibold text-dark/40 uppercase tracking-wider mb-4">Entités nommées (schema.org)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['fr', 'en'].map((l) => (
            <div key={l}>
              <FieldLabel>{l === 'fr' ? 'Entités FR' : 'Entities EN'}</FieldLabel>
              <JsonBlock value={fields[`entities_${l}`]} />
            </div>
          ))}
        </div>
      </section>

      {/* HowTo care */}
      <section>
        <h3 className="text-xs font-semibold text-dark/40 uppercase tracking-wider mb-4">HowTo entretien (schema.org)</h3>
        <JsonBlock value={fields.how_to_care_jsonld} />
        <p className="text-xs text-dark/30 mt-2">
          Schéma <code className="bg-dark/5 px-1 rounded">HowTo</code> généré automatiquement — à intégrer dans le JSON-LD de la page produit.
        </p>
      </section>
    </div>
  )
}

function TabWholesale({ fields, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Titre</FieldLabel>
        <input value={fields.wholesale_title ?? ''} onChange={(e) => onChange('wholesale_title', e.target.value)}
          className="input-field w-full" placeholder="Titre wholesale…" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <FieldLabel>Contenu (Markdown)</FieldLabel>
          <CopyBtn text={fields.wholesale_body ?? ''} />
        </div>
        <textarea value={fields.wholesale_body ?? ''} onChange={(e) => onChange('wholesale_body', e.target.value)}
          rows={16} className="input-field w-full font-mono text-xs resize-y leading-relaxed" />
      </div>
    </div>
  )
}

function TabEcom({ fields, onChange, lang }) {
  const l = lang
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1">
          <FieldLabel hint="max 60 car.">Titre SEO</FieldLabel>
          <CharCount value={fields[`seo_title_${l}`]} max={60} />
        </div>
        <input value={fields[`seo_title_${l}`] ?? ''} onChange={(e) => onChange(`seo_title_${l}`, e.target.value)}
          className="input-field w-full font-medium" placeholder={l === 'fr' ? 'Titre optimisé pour les moteurs…' : 'SEO-optimized title…'} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <FieldLabel hint="max 155 car.">Meta description</FieldLabel>
          <CharCount value={fields[`meta_desc_${l}`]} max={155} />
        </div>
        <textarea value={fields[`meta_desc_${l}`] ?? ''} onChange={(e) => onChange(`meta_desc_${l}`, e.target.value)}
          rows={3} className="input-field w-full resize-none" placeholder={l === 'fr' ? 'Description pour les résultats de recherche…' : 'Description shown in search results…'} />
      </div>
      <div>
        <FieldLabel>{l === 'fr' ? 'Mots-clés' : 'Keywords'}</FieldLabel>
        <TagList value={fields[`keywords_${l}`]} onChange={(v) => onChange(`keywords_${l}`, v)} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <FieldLabel>{l === 'fr' ? 'Description produit (HTML)' : 'Product description (HTML)'}</FieldLabel>
          <CopyBtn text={fields[`description_${l}`] ?? ''} />
        </div>
        <textarea value={fields[`description_${l}`] ?? ''} onChange={(e) => onChange(`description_${l}`, e.target.value)}
          rows={14} className="input-field w-full font-mono text-xs resize-y leading-relaxed" />
      </div>
      <div>
        <FieldLabel>FAQ — {l === 'fr' ? 'Optimisation GEO' : 'GEO Optimization'}</FieldLabel>
        <FaqEditor value={fields[`faq_${l}`]} onChange={(v) => onChange(`faq_${l}`, v)} />
      </div>
    </div>
  )
}

function TabJsonLd({ jsonLd }) {
  const str = JSON.stringify(typeof jsonLd === 'string' ? JSON.parse(jsonLd) : jsonLd, null, 2)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-dark/40">Données structurées générées automatiquement depuis la fiche produit.</p>
        <CopyBtn text={str} />
      </div>
      <pre className="bg-dark/3 border border-dark/8 rounded-lg p-4 text-xs font-mono text-dark/70 overflow-x-auto whitespace-pre leading-relaxed">
        {str}
      </pre>
      <p className="text-xs text-dark/30">À intégrer dans le <code className="bg-dark/5 px-1 rounded">{`<head>`}</code> de la page produit : <code className="bg-dark/5 px-1 rounded">{`<script type="application/ld+json">…</script>`}</code></p>
    </div>
  )
}

export default function FicheDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('wholesale')
  const [fields, setFields] = useState({})
  const [dirty, setDirty] = useState(false)
  const [saveOk, setSaveOk] = useState(false)

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
  })

  const { data: fiche, isLoading: loadingFiche } = useQuery({
    queryKey: ['fiches', id],
    queryFn: () => getFiche(id),
    retry: false,
  })

  useEffect(() => {
    if (fiche) {
      setFields({
        wholesale_title: fiche.wholesale_title ?? '',
        wholesale_body:  fiche.wholesale_body ?? '',
        seo_title_fr:    fiche.seo_title_fr ?? '',
        meta_desc_fr:    fiche.meta_desc_fr ?? '',
        description_fr:  fiche.description_fr ?? '',
        keywords_fr:     Array.isArray(fiche.keywords_fr) ? fiche.keywords_fr : [],
        faq_fr:          Array.isArray(fiche.faq_fr) ? fiche.faq_fr : (typeof fiche.faq_fr === 'string' ? JSON.parse(fiche.faq_fr) : []),
        seo_title_en:    fiche.seo_title_en ?? '',
        meta_desc_en:    fiche.meta_desc_en ?? '',
        description_en:  fiche.description_en ?? '',
        keywords_en:         Array.isArray(fiche.keywords_en) ? fiche.keywords_en : [],
        faq_en:              Array.isArray(fiche.faq_en) ? fiche.faq_en : (typeof fiche.faq_en === 'string' ? JSON.parse(fiche.faq_en) : []),
        json_ld:             fiche.json_ld ?? null,
        geo_blurb_fr:        fiche.geo_blurb_fr ?? '',
        geo_blurb_en:        fiche.geo_blurb_en ?? '',
        use_cases_fr:        Array.isArray(fiche.use_cases_fr) ? fiche.use_cases_fr : [],
        use_cases_en:        Array.isArray(fiche.use_cases_en) ? fiche.use_cases_en : [],
        alternate_titles_fr: Array.isArray(fiche.alternate_titles_fr) ? fiche.alternate_titles_fr : [],
        alternate_titles_en: Array.isArray(fiche.alternate_titles_en) ? fiche.alternate_titles_en : [],
        entities_fr:         fiche.entities_fr ?? null,
        entities_en:         fiche.entities_en ?? null,
        how_to_care_jsonld:  fiche.how_to_care_jsonld ?? null,
      })
      setDirty(false)
    }
  }, [fiche])

  const generateMutation = useMutation({
    mutationFn: () => generateFiche(id),
    onSuccess: (data) => {
      qc.setQueryData(['fiches', id], data)
      setDirty(false)
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => updateFiche(id, fields),
    onSuccess: (data) => {
      qc.setQueryData(['fiches', id], data)
      setDirty(false)
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 2000)
    },
  })

  const onChange = (key, val) => {
    setFields((prev) => ({ ...prev, [key]: val }))
    setDirty(true)
  }

  const getExportHref = (type) => {
    const base = import.meta.env.VITE_API_URL ?? '/api'
    const token = localStorage.getItem('plm_token')
    return `${base}/fiches/${id}/export/${type}?token=${token}`
  }

  if (loadingProduct) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (!product) return <div className="text-dark/40">Produit introuvable.</div>

  const hasFiche = !!fiche
  const generating = generateMutation.isPending
  const saving = saveMutation.isPending

  return (
    <div className="space-y-5 max-w-5xl">
      <Link to="/fiches" className="btn-ghost -ml-1 w-fit text-dark/50">
        <ArrowLeft size={14} /> Fiches commerciales
      </Link>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-dark/30">{product.reference}</span>
              <Badge status={product.status} />
            </div>
            <h2 className="font-serif text-xl text-dark">{product.name}</h2>
            {product.collection_name && (
              <p className="text-xs text-dark/40 mt-0.5">{product.collection_name}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasFiche && (
              <>
                <a href={getExportHref('wholesale')}
                  className="btn-secondary text-xs flex items-center gap-1.5">
                  <Download size={13} /> Wholesale .docx
                </a>
                <a href={getExportHref('ecommerce')}
                  className="btn-secondary text-xs flex items-center gap-1.5">
                  <Download size={13} /> E-commerce .docx
                </a>
              </>
            )}
            <button onClick={() => generateMutation.mutate()} disabled={generating}
              className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50">
              {generating
                ? <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Génération…</>
                : <><RefreshCw size={13} /> {hasFiche ? 'Régénérer' : 'Générer la fiche'}</>
              }
            </button>
          </div>
        </div>

        {generateMutation.isError && (
          <p className="mt-3 text-xs text-red-500">
            {generateMutation.error?.response?.data?.error ?? 'Erreur lors de la génération'}
          </p>
        )}
      </div>

      {!hasFiche && !generating && (
        <div className="card p-8 text-center">
          <FileText size={32} className="text-dark/20 mx-auto mb-3" />
          <p className="text-dark/40 text-sm">Aucune fiche générée pour ce produit.</p>
          <p className="text-dark/30 text-xs mt-1">Cliquez sur "Générer la fiche" pour créer les descriptifs wholesale et e-commerce.</p>
        </div>
      )}

      {(hasFiche || generating) && (
        <div className="card p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-cream border border-dark/5 rounded-lg p-1 w-fit mb-6">
            {TABS.map(({ id: tid, label, icon: Icon }) => (
              <button key={tid} onClick={() => setTab(tid)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  tab === tid ? 'bg-white shadow-sm text-dark' : 'text-dark/40 hover:text-dark'
                }`}>
                <Icon size={13} strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>

          {loadingFiche || generating ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <>
              {tab === 'wholesale' && <TabWholesale fields={fields} onChange={onChange} />}
              {tab === 'ecom_fr'   && <TabEcom fields={fields} onChange={onChange} lang="fr" />}
              {tab === 'ecom_en'   && <TabEcom fields={fields} onChange={onChange} lang="en" />}
              {tab === 'geo'       && <TabGeo fields={fields} onChange={onChange} />}
              {tab === 'jsonld'    && <TabJsonLd jsonLd={fields.json_ld} />}

              {tab !== 'jsonld' && (
                <div className="flex justify-end mt-6 pt-4 border-t border-dark/5">
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saving || !dirty}
                    className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {saving ? (
                      <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Enregistrement…</>
                    ) : saveOk ? (
                      <><Check size={14} /> Enregistré</>
                    ) : (
                      <><Save size={14} /> Enregistrer</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
