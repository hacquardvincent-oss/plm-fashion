# Expression du besoin — PLM Fashion
**Entretien avec la Directrice de Collection**
**Version :** 1.0 — Juin 2026

---

## Contexte

Ce document formalise les besoins exprimés lors d'un entretien avec la directrice de collection. Il constitue la base de travail pour l'évolution de l'outil PLM Fashion existant.

---

## 1. Suivi des collections

### 1.1 Page blanche (création d'une nouvelle référence)

L'utilisateur doit pouvoir initier une fiche produit à partir d'une "page blanche", c'est-à-dire sans avoir toutes les informations dès le départ.

**Besoins :**
- Création d'une matière à blanc avec génération automatique d'un code référence
- Conception progressive de la fiche produit (remplissage au fur et à mesure)
- **Versioning de la fiche produit :** chaque déclinaison d'une idée de création doit pouvoir être tracée comme une version distincte
- Chaque version dispose d'un statut : `proto`, `en cours`, `validé`, etc.

### 1.2 Gestion des reconduits

- Possibilité de récupérer des références existantes d'une saison précédente (reconduite)
- Liaison avec l'historique produit pour conserver le cycle de vie complet

### 1.3 Gestion des budgets

- Définition des budgets par collection, par famille, et par produit
- Calcul d'un objectif budget intégrant :
  - Taux d'annulation historique
  - Coût des prototypes

---

## 2. Fiche technique

### 2.1 Versioning

- Chaque fiche technique doit être versionnée (V1, V2, …)
- Les **grilles de tailles** doivent également être versionnées indépendamment

### 2.2 Calcul des composants et PRI

- Croisement des quantités de composants avec leur prix unitaire fournisseur (logique actuelle Orli/Cegid)
- Ce calcul génère le **PRI (Prix de Revient Industriel)**
- Le PRI doit être calculé automatiquement et mis à jour lors de chaque modification

### 2.3 Gestion multi-fournisseurs

- Pour chaque fiche produit, possibilité de renseigner plusieurs fournisseurs (Fournisseur 1, Fournisseur 2, …)
- Comparaison des offres fournisseurs possible

### 2.4 Croquis et visuels

- Ajout de **vues d'essayage** en complément des vues standard (face, dos, détail)

---

## 3. Matières

- Permettre la création d'une matière même si le formulaire n'est pas rempli en totalité (champs optionnels)
- Pricing matière dépendant des quantités réservées, avec statuts : `objectif`, `en cours de validation`, `validé`

---

## 4. Pricing

| Élément | Description |
|---|---|
| Prix matière | Calculé en fonction des quantités réservées |
| PRI | Calculé automatiquement depuis les composants |
| Prix produit | Calculé depuis le PRI + marges |
| Statuts | Objectif / En cours de validation / Validé |

---

## 5. Filtres et vues

L'utilisateur doit pouvoir filtrer et naviguer selon plusieurs axes :
- Par **fournisseur**
- Par **collection**
- Par **matière**
- Par **produit**
- Par **saison** (historique)

Ces filtres doivent s'appliquer aux vues globales et aux exports.

---

## 6. Workflow et collaboration

### 6.1 Système de notifications / tags

- Système de **post-it / notifications** attachés à un produit, une matière ou une collection
- Possibilité d'envoyer un tag ou une notification à un utilisateur spécifique
- Suivi de l'avancement : par collection, par produit

### 6.2 Gestion des droits

- Gestion des droits utilisateur (facultatif dans un premier temps)

### 6.3 Flux de données

- Flux : **Excel → Orli (Cegid) → NuOrder**
- Contrôle des données obligatoires avant export (champs manquants bloquants)
- Système d'alerte si des données nécessaires aux connecteurs sont manquantes dans le PLM

---

## 7. Nouveau module — Vue globale & Reporting

- **Vue globale de la collection** : tableau d'ensemble des références, filtrable par fournisseur / collection / matière
- **Vue historique** : consultation des collections passées
- **Gestion des visuels** : récupération des photos de grand shooting + stockage serveur
- **Historique produit** : cycle de vie complet d'un article toutes saisons confondues (conception → V1 → V2 → validé), quel que soit le statut

---

## 8. Modules existants à consolider

- **Gestion des commandes fournisseurs** (module Achats existant)
- **Traçabilité** des modifications

---

## 9. Nouvelles fonctionnalités identifiées

| Priorité | Fonctionnalité | Commentaire |
|---|---|---|
| Haute | Versioning fiches techniques | Clé pour le suivi des évolutions produit |
| Haute | PRI automatique | Lien composants × prix fournisseur |
| Haute | Contrôle données avant export | Nécessaire pour NuOrder / Cegid |
| Moyenne | Vue globale collection | Export et navigation multi-axes |
| Moyenne | Multi-fournisseurs par produit | Comparaison offres |
| Moyenne | Intégration données de vente N-1 | Aide au reconduit et au budget |
| Basse | Vues d'essayage croquis | Complément visuel |
| Basse | Gestion droits utilisateur | À affiner selon organisation |

---

## 10. Points à approfondir

- [ ] Définir le format exact du versioning (numérotation, déclencheur de création de version)
- [ ] Préciser le flux de calcul PRI : quels composants, quelles règles d'arrondi
- [ ] Définir les champs obligatoires pour chaque connecteur (Cegid, NuOrder)
- [ ] Spécifier le modèle de droits utilisateur souhaité
- [ ] Clarifier la gestion des visuels (taille max, formats acceptés, organisation serveur)

---

*Document à compléter et valider avec l'équipe produit avant développement.*
