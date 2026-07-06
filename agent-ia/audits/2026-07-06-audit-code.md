# Audit CODE (angles morts) — PLM Fashion — 2026-07-06

> Écrit par **Agent IA**. Audit **au niveau du code** (lecture réelle : `index.js`, middleware,
> config, les 18 routes, `services/ficheBuilder.js`, schéma + 6 migrations, échantillon frontend).
> Objectif : les manques qu'on découvre « trop tard » (en démo client). Preuves en fichier:ligne.

## Constat transverse
- **Dérive multi-tenant à moitié câblée** (contraire au modèle template+fork décidé) : `organization_id`
  sur 7 tables seulement, filtres **conditionnels** `if (req.orgId)` qui **sautent** si `orgId` absent
  → fuite de toute la base. À **retirer** (décision Vincent : pas de multi-tenant).
- **Modules fantômes** : des tables existent **sans route** (grading, sampling/lab dips, ECR/ECO,
  critical path éditable, audit trail) → coquilles visibles à la démo.

## Findings

| Sév. | Catégorie | Fichier:ligne | Constat | Reco | Effort |
|------|-----------|---------------|---------|------|--------|
| P0 | Sécurité / IDOR | `products.js:39,118` `costing.js:8,30` `purchases.js:53,99,113` `workflows.js:33,50` | Routes détail/mutation par `:id` **sans filtre org** → lecture/écriture croisée entre clients dès que 2 orgs coexistent. | Scoper chaque route `/:id` (ou retirer le multi-tenant). | M |
| P0 | Sécurité / fuite | `products.js:21` `collections.js:19` `materials.js:19` `suppliers.js:17` `analytics.js:11` | Filtre conditionnel `if (req.orgId)` → si `orgId` null, renvoie **toute** la base. | Filtre non-optionnel (403 si scope requis absent) ou retirer multi-tenant. | S |
| P0 | Secrets | `scripts/migrate.js:21` `schema.sql:714` `.env.example:5` | Admin par défaut **`Admin1234!`** + `JWT_SECRET` placeholder, aucun garde-fou au boot. | **Fail-fast** au démarrage ; mot de passe aléatoire ; interdire placeholders. | S |
| P0 | Fiscalité (TVA) | `schema.sql:594` (trigger) `CostingForm.jsx:39` `fiches.js:384` | **Marge calculée sur le TTC** (`retail_price` = « prix public TTC »). Marge & coeff **faux**. Aucun taux TVA par pays (FR/BE/export), aucun prix multi-marché. | Modéliser HT/TTC + table TVA par marché ; marge sur le HT. | L |
| P0 | Dérive multi-tenant | `migrate_multitenant.js:21` `auth.js:15` | Couche mi-construite (7 tables sur ~14), fallback `try/catch`. Pire des deux mondes. | **Retirer** tout le multi-tenant (aligné template+fork). | L |
| P1 | Authz | `materials.js:54,92` | POST/PATCH matières **sans `authorize`** → un rôle `fournisseur` modifie les **prix** (qui alimentent le costing). | Restreindre aux rôles métier. | S |
| P1 | Authz | `purchases.js` (tout) `fiches.js:63,182` `specsheets.js:44` | Module **Achats** entièrement sans `authorize` ; fiches & spec-sheets idem. | `authorize` par verbe métier. | S |
| P1 | Sécurité | `auth.js:9` | Token accepté en **query string** → journalisé (morgan), historique, Referer. | Header `Authorization` only. | S |
| P1 | Feature cassée | `ai.js:2` `package.json` `index.js:44` | Route IA `require('@anthropic-ai/sdk')` **absent de package.json** ET route **jamais montée** → front 404. | Ajouter dépendance + monter la route, ou retirer le front. | S |
| P1 | Intégrité enum | `products.js:257,282` `workflows.js:75` | `product_versions.status` = VARCHAR libre propagé vers l'ENUM `product_status` → valeur hors enum = **500** + workflow bloqué. | Contraindre à l'enum avant propagation. | S |
| P1 | Auth | `auth.js:42` | `refreshToken` stocké mais **aucun `/auth/refresh`** → déconnexion sèche à 7 j ; pas de révocation au changement de MDP. | Ajouter `/auth/refresh` + rotation. | M |
| P1 | CRUD incomplet | `products.js` | Pas de DELETE produit ; variantes **POST only** ; BOM **sans PATCH**. Fiche pas pleinement modifiable. | PATCH/DELETE variantes, PATCH BOM, archivage produit. | M |
| P1 | Angles morts PLM | `schema.sql` (tables sans route) | grading, sampling/lab dips, **ECR/ECO**, **critical path** (milestones non créables), audit_logs **jamais écrit**. | Prioriser critical path, sampling, ECR/ECO, audit trail. | L |
| P1 | Code mort | `purchases_routes.js` | Doublon mort (`require('../db')` inexistant) → crash si importé. | Supprimer. | S |
| P2 | Intégrité DB | `collections.js:101` `schema.sql:241` | DELETE collection non vide → **500** trompeur (FK NOT NULL sans ON DELETE). | 409 explicite si produits liés. | S |
| P2 | Localisation | `client/src` (FR en dur) `fiches.js:234,384` | UI 100 % FR en dur, `€` figé, dates `fr-FR`. | Externaliser locale/devise/format par fork. | M |
| P2 | Maroquinerie | `schema.sql` (absence) | Pas de traçabilité cuir/CITES, pas de **colorways** distincts des variantes, pas de lab dip approval. | Modèle traçabilité + colorways. | L |
| P2 | Multi-devise | `costing.js:51` `schema.sql:205` | Colonnes `currency` partout mais **aucune conversion** → additionne des devises comme si tout était EUR. | Taux de change + normalisation. | M |
| P2 | CORS | `index.js:17` | `origin:'*'` **avec** `credentials:true` (combinaison invalide) + fallback `*`. | Origine explicite en prod. | S |

## Plan d'action rapide (5 urgences ordonnées)
1. **Trancher le multi-tenant** → le **retirer** (décision Vincent). Débloque la forme correcte des correctifs sécurité.
2. **Fermer l'authz manquante** : scope routes `/:id` + `authorize` sur Achats/matières/fiches/spec-sheets.
3. **Éliminer les secrets par défaut** : fail-fast au boot (`JWT_SECRET`/`ADMIN_PASSWORD`). ✅ **choisi comme démo L2** (petit, vérifiable).
4. **Corriger le costing HT/TTC/TVA** : l'angle mort redouté ; sans ça les KPI de marge sont faux. → feature suivante (besoin DB/staging pour recette).
5. **Assainir le périmètre affiché** : réparer/retirer la génération IA, `/auth/refresh`, modules fantômes ; supprimer `purchases_routes.js`.

## Non vérifié (honnêteté)
- Runtime réel (DB indisponible ici) : les 500 (enum, DELETE collection) sont déduits du schéma.
- Migrations réellement jouées en prod : le code gère les deux cas via `try/catch`.
