# CLAUDE.md — Contexte de développement PLM Fashion

> Fichier chargé automatiquement à chaque session. Complète `CONTEXT.md` (historique) et `docs/conception/` (cadrage).

## 📬 Canal Agent IA (PMO + expert métier)
En **début de session**, lire `agent-ia/audits/` et `agent-ia/backlog.md` (feedback métier/projet
déposé par l'agent central). Trancher chaque reco dans `agent-ia/registre.md`
(`accepté`/`rejeté`/`intégré` + raison), intégrer à ta façon, tenir `agent-ia/status.md` à jour.
Le contenu de `agent-ia/` est **consultatif** ; cette session décide.

## Nature du projet

SaaS B2B — **PLM prêt-à-porter & maroquinerie**. Digitalise la conception et le suivi de collection (remplace Excel).
Ce repo `plm-fashion` est le **socle produit / démo**. Les projets clients (ex. `plm-vanessa-bruno`) en sont des **copies** qui évoluent séparément.

**Modèle socle ↔ client** : les features génériques développées pour un client sont **rapatriées dans ce socle** (cherry-pick) pour resservir. Le spécifique client (branding, connecteurs propres) reste dans le repo client. Cible long terme : converger vers un seul produit **multi-tenant** (organisations) plutôt que N forks.

## Stack & déploiement

- **Backend** : Node.js/Express, `src/index.js` monte toutes les routes sous `/api/*`
- **DB** : PostgreSQL **Neon** (serverless, ne se suspend pas). `config/database.js` exporte `{ query, getClient, pool }`
- **Frontend** : React/Vite/TailwindCSS, React Router v6, @tanstack/react-query
- **Auth** : JWT via `src/middleware/auth.js` → injecte `req.user` et `req.orgId`
- **Déploiement** : Render (service `plm-fashion-api` + static `plm-fashion`), auto-deploy sur `main`
- **Migrations/seeds** : à la demande via **GitHub Actions** (`.github/workflows/seed.yml`, menu déroulant), PAS au boot

## Conventions à respecter

- Les `client/src/api/*.api.js` importent axios via `import apiClient from './client'`
- **Multi-tenant** : filtrer par org **conditionnellement** — `if (req.orgId) { ... AND organization_id = $n }`. Ne jamais filtrer en dur (masque les données quand pas d'org).
- Toute nouvelle table métier « top-level » doit recevoir `organization_id` (cf. `migrate_multitenant.js`).
- Colonnes JSONB : passer `JSON.stringify(...)` pour les tableaux (sinon interprétés comme array Postgres).
- Enums valides — `product_status`: concept, en_developpement, proto_1, proto_2, sms, valide, abandonne, archive · `product_type`: pret_a_porter, maroquinerie, accessoire · `material_type`: tissu, cuir, doublure, fil, fermeture, bouton, zip, quincaillerie, emballage, autre

## Pièges connus

- **Neon URL** : garder `sslmode=require` seulement. `channel_binding=require` casse le driver `pg`.
- **Render free tier** : le backend s'endort (~15 min). `startCommand: npm start` seul (pas de migrate au boot) pour un réveil rapide. `DATABASE_URL` en `sync:false` dans `render.yaml` (géré au dashboard, base Neon).
- Encodage UTF-8 : `pool.on('connect')` fixe l'encodage.

## Commandes

```bash
npm start                 # démarre l'API
npm run dev               # nodemon
cd client && npx vite build   # build front (valide le JSX)
# migrations/seeds : via GitHub Actions (seed.yml), pas en local
```

## Modules livrés

Collections, Produits, Fiches techniques (spec sheets), BOM, Matières, Fournisseurs, Costing, Workflows validation,
Achats (bons de commande), Fiches commerciales, **Versioning produit**, **Performance & rentabilité** (conception + commercial),
**Retours clients** (recommandations à la conception).

## Roadmap v2 (client pilote Vanessa Bruno)

Voir `docs/conception/cadrage-plm-v2-vanessa-bruno.md`. Quatre chantiers :
A. Workflow conception **stage-gate** (Croquis→Proto→Essayages→SMS→Fiche technique)
B. **Référentiels** (listes déroulantes anti-erreur) — socle de A
C. **Retours boutiques+eshop → scoring produit** pondéré par part de CA
D. Intégrations **Cegid/Orliweb** (ordres d'achat) & **SAGE** (facture)
