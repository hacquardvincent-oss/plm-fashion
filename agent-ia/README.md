# Dossier `agent-ia/` — Canal consultatif PRODUIT

`plm-fashion` est le **produit / upstream** (source de vérité). Ce canal contient
l'expertise métier **générique** — « ce que tout PLM mode & maroquinerie doit avoir » —
plus le **mandat AI-Native**. Le spécifique client vit dans le canal des instances
(ex. `plm-vb`), pas ici.

> **Agent IA propose ici. La session produit dispose.**

## Contrat
- **Agent IA n'écrit QUE dans `agent-ia/`.** Jamais le code produit. Branches/PR limitées à `agent-ia/`.
- **La session produit** lit ce dossier en début de session, décide, intègre, met à jour
  `registre.md` et `status.md`.
- **L'humain** arbitre.

## Qui écrit quoi
| Fichier | Auteur | Rôle |
|---------|--------|------|
| `status.md` | Session produit | État du produit |
| `audits/` | **Agent IA** | Audits / notes de feedback datés |
| `backlog.md` | **Agent IA** | Backlog **produit** priorisé (générique) |
| `registre.md` | Session produit | Décision par reco (accepté/rejeté/intégré) |

## Règle de tri produit vs instance
Une reco entre ici **si elle est vraie pour tous les clients**. Sinon, elle va dans le
canal `agent-ia/` de l'instance client concernée. Voir le modèle produit/client dans le
dépôt cerveau (`agent-ia-test/charte/modele-produit-client.md`).

## ⚙️ Branchement (étape unique — session produit ou humain)
Ajouter une fois dans `CLAUDE.md`/`CONTEXT.md` :
> **Canal Agent IA** — Lire `agent-ia/audits/` + `agent-ia/backlog.md` en début de session,
> tenir `agent-ia/registre.md` + `agent-ia/status.md` à jour.
