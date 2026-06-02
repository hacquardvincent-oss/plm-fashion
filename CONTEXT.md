# CONTEXT.md — PLM Fashion
> Charger EN PREMIER à chaque session sur ce projet.
> Version : 02/06/2026

---

## 🔗 Liens

| Ressource | URL |
|-----------|-----|
| GitHub | https://github.com/hacquardvincent-oss/plm-fashion (privé) |
| Drive | https://drive.google.com/drive/folders/1dCPjCuV_iUYk4WyFBbCZBLVuTYB4wPTJ |
| Render API | https://dashboard.render.com → service `plm-fashion-api` |
| Render Front | https://dashboard.render.com → service `plm-fashion` |
| Render DB | https://dashboard.render.com → service `plm-fashion-db` |

---

## Projet

**Type** : SaaS B2B — PLM pour prêt-à-porter et maroquinerie
**Usage réel** : Vanessa Bruno / SOLUNE (référence terrain)
**Stack** : Node.js/Express + PostgreSQL (Render) + React/Vite/TailwindCSS + JWT + Claude API
**Déploiement** : Render free tier (API + Static Site + PostgreSQL)
**Statut** : MVP actif, stabilisation en cours avant commercialisation

---

## Architecture

```
plm-fashion/
├── src/                    # Backend Node.js/Express
│   ├── index.js            # Point d'entrée, app.use() de toutes les routes
│   ├── routes/             # auth, collections, products, materials, suppliers,
│   │                       # costing, workflows, documents, users, fiches,
│   │                       # specsheets, purchases
│   └── middleware/auth.js  # authenticate (JWT), authorize
├── config/
│   └── database.js         # Pool pg — exports : { query, getClient, pool }
├── scripts/migrate.js      # Migration DB au démarrage
├── client/                 # Frontend React/Vite
│   ├── public/_redirects   # /* /index.html 200  (SPA routing Render)
│   ├── src/
│   │   ├── api/            # *.api.js — import depuis './client' (axios)
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── router/index.jsx
│   └── package.json        # build: vite build
└── package.json            # start: node src/index.js | migrate: node scripts/migrate.js
```

**Convention importante** : les fichiers `client/src/api/*.api.js` importent l'axios client via `import apiClient from './client'` (pas `'./api'`).

---

## Fonctionnalités existantes ✅

- Auth JWT + refresh tokens
- Collections, Produits
- Fiches Techniques (FTP) — structure Vanessa Bruno / SOLUNE
- BOM (nomenclature matières), bibliothèque matières, fournisseurs
- Costing (coût de revient basique)
- Workflows de validation (approve/reject)
- Upload documents
- Génération descriptions IA via Claude API
- Module fiches commerciales : wholesale + e-commerce SEO/GEO
- Génération batch de fiches par collection
- **Module Achats** (ajouté 01/06/2026) : bons de commande, réception ligne par ligne, contrôle qualité, suivi statuts

---

## 🐛 Bugs connus & fixes appliqués

### ✅ BUG-001 — "Not Found" au Ctrl+F5 (React SPA routing)
**Cause** : Render Static Site ne redirige pas les routes vers `index.html`
**Fix** : `client/public/_redirects` créé avec `/* /index.html 200`
**Statut** : À appliquer (commit en attente)

### ✅ BUG-002 — Module Achats ne compilait pas
**Cause 1** : `purchases.api.js` importait `'./api'` au lieu de `'./client'` → résolu commit `f4e230e`
**Cause 2** : `src/routes/purchases.js` requireait `'../db'` (inexistant) au lieu de `'../../config/database'` → résolu commit `42241ce`

### ⚠️ BUG-003 — Credentials admin dans README public
**Action** : Supprimer de `README.md` : `admin@plm-fashion.com / Admin1234!`
**Statut** : **À faire en priorité**

---

## 🚨 Incident 01/06/2026 — Panne base de données

**Cause** : PostgreSQL free tier Render supprimé automatiquement après 90 jours
**Résolution** : Nouvelle DB créée, `DATABASE_URL` mise à jour dans `plm-fashion-api`
**Données perdues** : Oui (pas de backup en place)
**Action urgente** : Configurer `pg_dump` automatique ou passer Render paid tier

---

## Référence FTP réelle (SPECIFICATIONS/)

Les fichiers Excel dans `SPECIFICATIONS/` sont de vraies FTP Vanessa Bruno (SOLUNE).
Structure de référence :
- Croquis technique
- Fiche de normalisation
- Fiche commentaires
- Fiche technique (mesures + grading)
- FCM (composants)

→ C'est le format à digitaliser dans le module FTP du PLM.

---

## Roadmap

### Priorité 1 — Stabilisation immédiate
- [ ] **BUG-003** : Supprimer credentials du README
- [ ] **BUG-001** : Vérifier déploiement `_redirects` sur Render
- [ ] Backup automatique DB (pg_dump cron ou Render paid)

### Priorité 2 — Enrichissement modules existants
- [ ] **Croquis** : section dédiée dans FTP (upload image + éditeur canvas face/dos/détail + annotations)
- [ ] **Matières** : fiche complète (composition, grammage, certifications, photos, lien fournisseur/prix, historique usage)
- [ ] **Fournisseurs** : fiche complète (contacts, délais, certifications, portfolio matières, historique, évaluation)
- [ ] **Costing** : structure détaillée (matières + façon + transport + marge), costing par canal, simulation scénarios, historique versions
- [ ] **Achats** : page liste `PurchasesPage.jsx` à finaliser selon maquette

### Priorité 3 — Commercialisation
- [ ] Multi-tenant (isolation des données par client)
- [ ] Onboarding client (création compte + setup)
- [ ] Facturation / abonnement (Stripe)
- [ ] Landing page commerciale
- [ ] Permissions par rôle (admin, styliste, acheteur, fournisseur)
- [ ] Export PDF fiches techniques
- [ ] Partage externe (lien fournisseur)
- [ ] RGPD / CGU

---

## Historique des sessions

### Session 01/06/2026
- Ajout module Achats complet (routes API + pages React)
- Résolution bugs imports (`./api` → `./client`, `../db` → `../../config/database`)
- Incident panne DB Render (free tier expiré) — nouvelle DB recréée
- Fichiers mal nommés au upload (`purchases_api.js`, `purchases_routes.js`) → renommés aux bons chemins

### Session 02/06/2026
- Mise à jour CONTEXT.md (ce fichier)
- Tentative ajout pages Matières / Fournisseurs / Costing + fix `_redirects` (fichiers Drive inaccessibles — upload direct nécessaire)
