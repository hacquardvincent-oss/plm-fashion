# Audit MÉTIER PRODUIT (sourcé) — PLM Fashion & Maroquinerie — 2026-07-06

> Écrit par **Agent IA (double métier)**. Audit **sourcé** (recherche standards du marché +
> process réel d'une équipe collection). Remplace le pré-audit « cycle 0 ». Le backlog
> priorisé et chiffré est dans `backlog.md`. La session produit arbitre via `registre.md`.

## 1. Étalon marché
Les PLM mode de référence — **Centric**, **PTC FlexPLM** (sur Windchill), **Bamboo Rose** —
couvrent une chaîne bien plus large que le milieu (FTP/BOM/costing) : merchandise/line
planning, **critical path**, sourcing, échantillonnage, conformité, collaboration fournisseurs.
([Centric](https://www.centricsoftware.com/fashion-apparel), [FlexPLM](https://www.ptc.com/en/industries/retail/flexplm), [Bamboo Rose](https://bamboorose.com/flexible-plm/))

## 2. Workflow métier cible (process équipe collection)
Le cœur d'un PLM mode est le **critical path / Time & Action** planifié **à rebours** depuis la
date de mise en marché ; chaque jalon est dépendant, et un retard amont fait glisser tout l'aval
(« un tech pack livré 3 semaines en retard déclenche 8 retards en cascade »).
([Kōbō](https://www.kobolabs.io/blog/ops/critical-path), [thefword](https://thefword.ai/what-is-a-critical-path-in-fashion))

```
MFP/OTB → Line/Range plan → Design & croquis → Colorways → FTP + BOM →
Sourcing/RFQ → Prototype (proto→SMS→PPS) → Fitting sessions → Lab dips/strike-offs →
Costing (landed, par canal) → Validation (Time & Action) → Achats/PO → Prod → Livraison → (DPP)
```

## 3. Couverture actuelle vs cible
| Domaine | Couvert ? | Écart |
|---------|-----------|-------|
| FTP / tech pack (mesures, grading) | ✅ partiel | Grading & construction à compléter |
| BOM / matières / fournisseurs | ✅ | Fiches matières/fournisseurs à enrichir |
| Costing | ⚠️ basique | Pas de **landed cost** ni costing **par canal**, ni scénarios/versions |
| Workflows validation | ✅ | OK, mais pas reliés à un **critical path** |
| Achats / PO | ✅ | Pas de **boucle RFQ** amont |
| **Time & Action / critical path** | ❌ | **Manque structurant n°1** |
| **Colorways** | ❌ | Un modèle = N coloris : non modélisé |
| **Line/Range plan** (assortiment) | ❌ | Amont collection absent |
| **Sampling** (proto/SMS/PPS + fittings) | ❌ | Cycle de dev produit invisible |
| **Lab dips / strike-offs** | ❌ | Jalon qualité couleur absent |
| **Maroquinerie : traçabilité cuir + CITES/REACH** | ❌ | Risque **légal** (cuirs exotiques) |
| **EU Digital Product Passport** | ❌ | Réglementaire à anticiper (voir §5) |

## 4. Tech pack, BOM & costing — précisions
Un tech pack complet = flats, **BOM** (chaque matière/fourniture : zip, boutons, étiquettes,
fils…), specs de mesures, **grading**, construction, étiquetage, packaging, **costing**, approbations.
Le BOM sert au costing ET à l'appro — une erreur ici impacte directement la marge. Un PLM mature
calcule le **landed cost** depuis le BOM, modélise la marge à plusieurs prix, et compare les
fournisseurs. ([Onbrand tech pack](https://www.onbrandplm.com/blog/tech-pack), [WFX](https://www.worldfashionexchange.com/blog/tech-pack-101-everything-you-need-to-know-about-fashion-tech-packs/))

## 5. Maroquinerie & conformité (spécifique, à fort enjeu luxe)
- **CITES** : tout produit en cuir exotique (croco, python, autruche) doit être accompagné d'un
  **certificat CITES** traçant espèce/origine. Sans gestion documentaire = risque légal à l'export.
  ([Chroonoo](https://www.chroonoo.com/guides/cites-certification-for-watch-straps-exotic-leather-sourcing-regulations-explained/), [Romestation](https://romestation.ca/blogs/news/exotic-leather-laws-by-region-what-s-legal-to-buy-sell-or-ship-in-2025))
- **Traçabilité cuir** : liens **batch-level** hide → produit fini, due diligence au-delà du tier-1
  (EUDR pour le bovin : origine sans déforestation, géoloc). ([TracexTech](https://tracextech.com/eudr-leather/), [Textile Exchange](https://textileexchange.org/app/uploads/2021/06/LIA-261-V0.1-Leather-Supply-Chain-Mapping-and-Traceability-Guidelines.pdf))
- **EU Digital Product Passport (ESPR)** : 1re spéc textile publiée le 13/05/2026 — **49 données**
  en 4 catégories (identification produit/producteur, composition, conformité chimique, empreinte).
  Obligatoire priorité textile **fin 2028–mi 2029** (1re collection SS2028) ; cuir/chaussure visés
  **~2030**. → **Modéliser dès maintenant** ces données dans le PLM est un avantage concurrentiel.
  ([TracexTech DPP](https://tracextech.com/eu-textile-strategy-dpp-compliance/), [euverify](https://euverify.com/resource/eu-dpp-data-requirements-textiles/))

## 6. Axe AI-Native (frontière Tiraboschi → produit)
La bascule 2026 va du **génératif** vers l'**agentique** (workflows exécutés de bout en bout).
Gains documentés : création de patron **8h → 10 min**, dev **-70 %**, coûts **-75 %** ; le
**sampling numérique/3D** coupe **60-80 %** des échantillons physiques (concept→sample en jours).
([Veeton 2026](https://veeton.com/blog/a-2026-report-on-ai-s-newest-capabilities-for-fashion), [StyTrix sampling](https://www.stytrix.com/blog/digital-sampling-fashion-reduce-physical-samples-2026), [Style3D](https://www.style3d.com/blog/how-is-plm-used-in-fashion/))
→ pistes P-A0x du backlog. C'est là que Tiraboschi (marque AI-native) doit pousser en premier.

## 7. Synthèse & priorités
- **P0 (structurant / risque)** : Time & Action (P-001), Colorways (P-002), CITES maroquinerie
  (P-013), Backup DB automatisé (J-001, cf. audit projet).
- **P1 (métier profond)** : Line plan (P-003), Sampling+fittings (P-004/005), Lab dips (P-006),
  Costing landed/par canal (P-007), Traçabilité cuir (P-012), REACH (P-014), DPP-ready (P-015),
  Rôles (P-010).
- **AI-Native** : design assist, trend forecasting, costing assisté, 3D sampling, agentique.

## 8. Prochain cycle
Chiffrage en jours (après lecture fine du code), maquettes de data model (colorways, critical
path, traçabilité), et priorisation conjointe avec toi. Les demandes **Vanessa Bruno** qui
s'avèrent génériques remonteront ici via le flux montant.
