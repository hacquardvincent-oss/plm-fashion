# Backlog PRODUIT — PLM Fashion & Maroquinerie

> Rempli par **Agent IA (double métier)**. Version **sourcée** (voir
> `audits/2026-07-06-audit-metier-produit.md`). Backlog **générique** (valable pour tous les
> clients) = niveau produit. La session produit arbitre via `registre.md`.

Priorité : `P0` critique · `P1` important · `P2` confort — Effort : `S`/`M`/`L`/`XL` (à confirmer après lecture code) — 🤖 AI-Native

## Workflow cible
MFP/OTB → Line/Range plan → Design & croquis → **Colorways** → FTP + BOM → Sourcing/RFQ →
Prototype (proto→SMS→PPS) → **Fitting sessions** → **Lab dips/strike-offs** → Costing (landed,
par canal) → Validation (**Time & Action**) → Achats/PO → Prod → Livraison → **DPP**.

## Métier — cœur collection
| ID | Prio | Effort | Fonctionnalité | Justification |
|----|------|--------|----------------|---------------|
| P-001 | P0 | L | **Time & Action Calendar / critical path** (jalons à rebours, dépendances, alertes retard) | Colonne vertébrale ; le retard amont fait glisser tout l'aval. |
| P-002 | P0 | M | **Colorways** (un modèle = N coloris ; propagation FTP/BOM/costing/achats) | Structure de base non modélisée aujourd'hui. |
| P-003 | P1 | L | **Line/Range plan** (assortiment styles/coloris/tailles + budget par famille) | Amont collection ; cadre ce qui est développé. |
| P-004 | P1 | L | **Cycle sample** (demandes proto → SMS → PPS, rounds, statuts) | Cœur du dev produit, invisible actuellement. |
| P-005 | P1 | M | **Fitting sessions** (planif, commentaires, révisions de mesures) | Jalon de mise au point produit. |
| P-006 | P1 | M | **Lab dips / strike-offs** (validation coloris & imprimés, aller-retour fournisseur) | Jalon qualité couleur avant prod. |
| P-007 | P1 | L | **Costing détaillé** (matières+façon+trims+transport+douanes = **landed cost**, **par canal**, scénarios, versions) | Le costing basique actuel ne protège pas la marge. |
| P-008 | P2 | M | **Boucle RFQ fournisseur** (appel d'offres multi → comparaison → prix retenu) | Étend Achats vers la négociation amont. |
| P-009 | P2 | M | **Grading / size run** (tableau de mesures gradé complet) | Complète la FTP existante. |
| P-010 | P1 | M | **Permissions par rôle** (styliste, modéliste, acheteur, fournisseur) | Prérequis partage externe & robustesse multi-utilisateurs. |
| P-011 | P2 | M | **Export PDF tech pack + partage externe** (lien fournisseur) | Collaboration hors plateforme. |

## Maroquinerie & conformité
| ID | Prio | Effort | Fonctionnalité | Justification |
|----|------|--------|----------------|---------------|
| P-012 | P1 | L | **Traçabilité cuir** (liens batch hide→produit, due diligence tier-n) | Exigence luxe + EUDR. |
| P-013 | P0* | M | **Gestion certificats CITES** (cuirs exotiques : espèce, origine, docs) | *P0 pour la maroquinerie exotique — risque **légal** à l'export. |
| P-014 | P1 | M | **REACH / substances of concern** (déclaration, seuils) | Conformité chimique UE. |
| P-015 | P1 | L | **DPP-ready** (data model des 49 points ESPR, prêt pour SS2028) | Anticipation réglementaire = avantage concurrentiel. |

## AI-Native (frontière Tiraboschi → produit) 🤖
| ID | Prio | Effort | Piste | Idée |
|----|------|--------|-------|------|
| P-A01 | P1 | M | Design/croquis assist | Génération & variation de croquis/détails depuis le brief. |
| P-A02 | P2 | L | Trend forecasting | Suggestions collection commercialement viables (données marché). |
| P-A03 | P1 | M | Sourcing & costing assistés | Suggestion matières/fournisseurs + estimation coût de revient. |
| P-A04 | P2 | XL | 3D digital sampling | Réduire 60-80 % les échantillons physiques (concept→sample en jours). |
| P-A05 | P2 | S | GEO/SEO génératif | Extension de l'existant (fiches commerciales). |
| P-A06 | P2 | L | PLM agentique | Workflows exécutés de bout en bout (la bascule 2026). |
| P-A07 | P2 | M | QC assisté | Aide à la détection d'écarts en réception (module Achats). |

## Projet / infra (voir audit projet côté plm-vb)
| ID | Prio | Effort | Item |
|----|------|--------|------|
| J-001 | P0 | S | **Backup DB automatisé** (GitHub Actions planifié + rétention) — perte de données déjà survenue |
| J-002 | P1 | S | **Secrets** : rotation `JWT_SECRET` + scan de l'historique git |

## Mandat d'ambition fonctionnelle (retours Vincent — 06/07)
> Principe : ne jamais s'arrêter au happy-path minimal. Chaque module doit être **auto-challengé
> contre le standard marché** et livré en **workflow abouti**. On développe aujourd'hui ~10 % du
> potentiel ; la cible est la profondeur fonctionnelle réelle. Vincent apporte la **valeur
> d'hybridation** par-dessus une base solide.

| ID | Prio | Effort | Fonctionnalité | Justification |
|----|------|--------|----------------|---------------|
| P-016 | P0 | M | **FTP : exposer toute la profondeur dans l'UI** (édition après création, versioning, workflow riche piloté) | ⚠️ Le modèle est en avance sur l'UI : la BDD **Neon** existe, l'enum `product_status` a déjà **8 états** (concept→proto_1/2→sms→valide→abandonne→archive) et un module **Versioning produit** existe. Le gap est l'**exposition UI**, pas la fondation. À confirmer par audit code. |
| P-017 | P1 | L | **Moteur PLM → eshop** (à la validation produit, génération auto de fiches **SEO/GEO optimisées** : titres, descriptions, attributs, balisage) pour armer la force de vente | Hybridation : transforme le PLM en levier commercial. Étend le module fiches commerciales existant + P-A05. |
| P-018 | P1 | M | **Auto-challenge continu** : chaque module comparé au standard (Centric/FlexPLM) → écarts remontés en reco | Institutionnalise « viser 100 % du potentiel ». |
