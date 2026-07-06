# Cadrage projet PLM — v2 · Client pilote : Vanessa Bruno

> Document de lancement et de suivi. Sert à la fois de **référentiel méthodo réutilisable** (socle) et de **brief du premier client** (Vanessa Bruno).
> Version 1 — à faire vivre au fil du projet.

---

## 1. Contexte & objectif

**Le besoin du client** : remplacer la conception et le suivi de collection **sur Excel** par une plateforme **simple, fiable et cadrée**.

Le mot d'ordre : *simple mais plus poussé*. On ne cherche pas l'exhaustivité fonctionnelle, mais un **outil qui fonctionne vraiment** sur la chaîne de valeur réelle :

```
Conception collection → Développement produit (proto/essayages) → Fiche technique
   → Production (ordres d'achat) → Vente → Analyse de performance → Reconduction
```

**3 différenciateurs vs Excel** :
1. **Un workflow guidé** étape par étape (fini le fichier qui part dans tous les sens)
2. **Une saisie cadrée** par des listes déroulantes reliées à une base (fini les fautes de frappe et les données inexploitables)
3. **La donnée qui remonte** : retours boutiques + eshop injectés dans la conception, analyse de perf en fin de saison

---

## 2. Périmètre v2 — les 4 chantiers client

| # | Chantier | Objectif | Priorité |
|---|----------|----------|----------|
| A | **Workflow de conception stage-gate** | Tunnel Croquis → Proto → Essayages → SMS → Fiche technique, formulaires adaptés par étape | 🔴 Haute |
| B | **Référentiels / saisie cadrée** | Listes déroulantes reliées à une BDD (matières, coloris, tailles, motifs…) | 🔴 Haute (socle de A) |
| C | **Retours boutiques + eshop → scoring** | Injecter les retours multicanaux dans la data de conception, avec scoring pondéré | 🟠 Moyenne |
| D | **Intégrations compta & ERP** | Orliweb/Cegid (ordres d'achat), SAGE (suivi facture) | 🟢 Phase 2 |

---

## 3. Chantier A — Workflow de conception (stage-gate)

### 3.1 Les étapes du tunnel

```
[Croquis] → [Demande proto] → [Proto V1] → [Essayage 1] → [Essayage 2] → [Essayage 3] → [SMS] → [Fiche technique validée] → [Bon à produire]
```

Chaque étape est une **porte de validation** : on ne passe à la suivante que si les champs obligatoires de l'étape courante sont remplis et validés.

### 3.2 Formulaire adapté à chaque étape

| Étape | Champs saisis (cadrés par référentiels) | Décision de sortie |
|-------|------------------------------------------|--------------------|
| **Croquis** | Thème, gamme, famille/sous-famille, dessin à plat (upload), matière(s) envisagée(s), coloris envisagés | Validé pour proto |
| **Demande proto** | Façonnier, taille de base, délai souhaité, mesures demandées | Envoyée |
| **Proto V1** | Réception proto, photos, première évaluation | Prêt essayage |
| **Essayage 1/2/3** | Mesures **réelles vs grille cible**, retouches **par zone/point** (motif dans liste fermée), photos cabine, décision | OK / À revoir |
| **SMS** | Validation commerciale, coloris retenus, gamme de prix | Validé showroom |
| **Fiche technique** | Dossier complet figé (FCM, grading, labelling, entretien) | Bon à produire |

### 3.3 Recommandations
- **Verrouillage progressif** : les champs des étapes non atteintes sont masqués → saisie guidée, zéro champ inutile.
- **Historisation des essayages** : chaque essayage garde ses mesures + photos → on visualise l'évolution V1→V2→V3 (le module *versioning* déjà présent sert de base).
- **Chaque retouche = une ligne traçable** (zone, point de mesure, écart cm, motif, statut ouvert/traité).

---

## 4. Chantier B — Référentiels (saisie cadrée)

Module **Référentiels** = nomenclatures qui alimentent tous les formulaires en **listes déroulantes**. C'est la fondation anti-erreur.

| Référentiel | Alimente | Exemple |
|-------------|----------|---------|
| Matières | BOM, FCM, croquis | base matières existante |
| Fournisseurs / façonniers | proto, achats | base fournisseurs |
| Nuancier / coloris | croquis, variantes | codes couleur normalisés |
| Familles / sous-familles | produit | Pantalon, Robe, Veste… |
| Tailles & systèmes | grading | FR 34-46, IT… |
| Points de mesure | essayages | A=poitrine, B=taille… |
| Motifs de retouche | essayages | liste fermée |
| Motifs de retour | scoring retours | trop petit, couleur, qualité… |
| Entretien | fiche technique | pictogrammes ISO |

**Bénéfice clé** : une donnée cohérente et **agrégeable** — indispensable pour le scoring retours (chantier C) et l'analyse de perf. Sans référentiels, pas d'analyse fiable.

---

## 5. Chantier C — Retours boutiques + eshop & scoring produit

### 5.1 Principe

Injecter les retours **multicanaux** (eshop + réseau de magasins) dans la donnée de conception, pour **alerter à la source** : au moment de reconduire ou concevoir un produit similaire, l'équipe voit le signal.

Deux canaux, deux natures de signal :
- **Eshop** : signal **quantitatif** (taux de retour, valeur retournée en €)
- **Retail (magasins)** : signal **qualitatif + réseau** (combien de magasins remontent le même problème)

### 5.2 Le modèle de scoring (pondéré par la part de CA)

L'idée : un produit peut sembler « catastrophique » sur l'eshop mais l'eshop ne pèse que X % du CA. On **pondère chaque signal par le poids de son canal dans le CA de l'enseigne**.

```
Score_alerte(produit) =  w_eshop × Signal_eshop  +  w_retail × Signal_retail

avec :
  w_eshop  = % du CA réalisé en e-commerce      (ex : 30 %)
  w_retail = % du CA réalisé en magasin          (ex : 70 %)
  (w_eshop + w_retail = 100 % du CA distribué)
```

**Signal eshop** (normalisé 0–100) :
```
Signal_eshop = f(taux_retour_eshop, valeur_retours_eshop / CA_produit_eshop)
```
> Ex : « XXX € retournés via le site = 10 % du CA du produit » → signal élevé.

**Signal retail** (normalisé 0–100) :
```
Signal_retail = f(nb_magasins_signalant / nb_magasins_total, volume_retours_retail)
```
> Ex : « 18 magasins sur 40 remontent le même défaut » → 45 % du réseau → signal élevé.

### 5.3 Exemple chiffré

> Produit « Pantalon X ». Enseigne : retail = 70 % du CA, eshop = 30 %.
> - Eshop : taux de retour 28 %, soit un signal eshop = **80/100**
> - Retail : 18 magasins / 40 remontent « taille hanches trop juste » = 45 % du réseau, signal retail = **60/100**
>
> **Score alerte = 0,30 × 80 + 0,70 × 60 = 24 + 42 = 66/100 → 🟠 Alerte produit élevée**
> Motif dominant : *taille hanches trop juste* (cohérent eshop + retail).

### 5.4 Boucle vertueuse (lien avec l'existant)

Ce scoring **alimente le module « Retours clients »** déjà construit dans la démo :
```
Retours multicanaux → Scoring produit → Recommandation affichée à la conception
```
Quand l'équipe crée une fiche pantalon, elle voit : *« Réf. similaire : score alerte 66/100 — hanches trop justes (45 % du réseau + 28 % retour eshop). Élargir de +2 cm. »*

### 5.5 Recommandations
- **Seuils configurables** par enseigne (ce qui est « critique » varie).
- **Traçabilité du motif** : toujours rattacher le score à un motif (liste fermée) → exploitable en conception.
- **Source de données** : eshop (plateforme e-commerce) + remontées magasins (via ERP retail ou saisie). Démarrer en **import fichier**, industrialiser ensuite.

---

## 6. Chantier D — Intégrations compta & ERP

| Système | Rôle | Approche recommandée |
|---------|------|----------------------|
| **Orliweb / Cegid** | Pousser les fiches → **ordres d'achat**, récupérer ventes & stock | API Cegid si dispo, sinon **export/import fichiers** au format Cegid (MVP) |
| **SAGE** | **Suivi de facture** rattaché aux ordres d'achat | Web services Sage 100/X3 ou échange fichiers ; rapprochement facture ↔ OA |

**Architecture** : une **couche d'intégration à connecteurs** (le cadre « intégrations » existe déjà dans le schéma). On démarre en **fichiers Excel/CSV bidirectionnels** — fiable, testable, sans dépendre des accès API — puis bascule API.

**Prérequis client** : obtenir la **doc API / formats de fichiers** Cegid (Orliweb) et SAGE.

---

## 7. Chantier E — Performance de fin de saison

Boucler l'analyse déjà amorcée (module Commercial) avec les **volumes et le stock** :

| Indicateur | Source |
|------------|--------|
| Volume acheté (matières + pièces) | Ordres d'achat (Cegid) |
| Quantités vendues (sell-through) | ERP / eshop |
| **Stock restant** (invendus, valeur immobilisée) | ERP |
| Taux d'écoulement | calculé |
| Marge réalisée | CA net − coût d'achat |
| Reste à écouler | valeur stock |

→ Vue **par collection**, exportable, pour piloter la reconduction saison suivante.

---

## 8. Modèle de données — nouvelles tables à prévoir

| Table | Usage |
|-------|-------|
| `referentials` (ou tables dédiées) | valeurs des listes déroulantes (type, libellé, actif) |
| `design_stages` / statut sur `products` | étape courante dans le tunnel stage-gate |
| `fittings` (essayages) | 1 ligne / essayage : mesures réelles, décision |
| `fitting_alterations` | retouches par zone/point/motif |
| `return_signals` | retours bruts par produit × canal (eshop/retail) |
| `return_scores` | score alerte calculé par produit (+ motif dominant) |
| `integration_jobs` | imports/exports Cegid & SAGE (statut, fichier, horodatage) |

> Le module `return_insights` (déjà en place) devient la **couche recommandation** alimentée par `return_scores`.

---

## 9. Phasage & roadmap

### Lot 1 — Fondations (remplacer Excel)
- [ ] Module **Référentiels** (chantier B)
- [ ] **Workflow stage-gate** + formulaires par étape (chantier A)
- [ ] Migration des données Excel existantes (reprise de l'historique collection)

### Lot 2 — Intelligence data
- [ ] **Scoring retours** multicanaux (chantier C)
- [ ] Branchement sur le module recommandation existant
- [ ] **Perf fin de saison** (chantier E)

### Lot 3 — Intégrations
- [ ] Connecteur **Cegid/Orliweb** (fichiers → API)
- [ ] Connecteur **SAGE** (suivi facture)

---

## 10. Suivi de projet

- **Ce document** = référence vivante. Chaque lot livré coche ses cases et date la livraison.
- **Jalons de validation client** à chaque fin de lot (démo + retour).
- **Gouvernance socle ↔ client** : les features génériques (référentiels, workflow, scoring) sont développées dans `plm-vanessa-bruno` puis **rapatriées dans le socle** `plm-fashion` pour les futurs clients. Le spécifique VB (branding, connecteurs Cegid/SAGE propres) reste dans le repo client.

---

## Annexe — Glossaire métier

| Terme | Définition |
|-------|------------|
| **Croquis à plat** | Dessin technique du vêtement (CAD), face/dos |
| **Proto** | Prototype physique du modèle |
| **Essayage (fitting)** | Passage cabine : mesures réelles + retouches |
| **Grading** | Déclinaison des mesures sur toutes les tailles |
| **SMS** | *Salesman Sample* — échantillon commercial (showroom) |
| **BAP** | Bon à produire — validation technique finale |
| **FCM** | Fiche de composition matières (nomenclature) |
| **OA** | Ordre d'achat (production) |
| **Sell-through** | Taux d'écoulement (vendu / acheté) |
