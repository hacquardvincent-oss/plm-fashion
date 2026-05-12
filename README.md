# PLM Fashion & Maroquinerie — API Backend

API REST Node.js/Express pour le système PLM prêt-à-porter et maroquinerie.

## Stack technique
- **Runtime** : Node.js 18+
- **Framework** : Express 4
- **Base de données** : PostgreSQL 15+ (hébergé sur Render)
- **Auth** : JWT + Refresh tokens
- **Déploiement** : Render (free tier)

## Installation locale

```bash
git clone https://github.com/VOTRE_PSEUDO/plm-fashion
cd plm-fashion
npm install
cp .env.example .env
# Remplir les variables dans .env
npm run migrate   # Crée les tables et l'admin
npm run dev       # Démarrage en mode développement
```

## Variables d'environnement requises

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000
NODE_ENV=development
```

## Endpoints principaux

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil courant |
| GET | `/api/collections` | Liste des collections |
| POST | `/api/collections` | Créer une collection |
| GET | `/api/products` | Liste des produits/FTP |
| GET | `/api/products/:id` | Fiche technique complète |
| POST | `/api/products` | Créer un produit |
| POST | `/api/products/:id/bom` | Ajouter une matière (BOM) |
| GET | `/api/materials` | Bibliothèque matières |
| GET | `/api/suppliers` | Liste fournisseurs |
| GET | `/api/costing/:productId` | Costing courant |
| POST | `/api/costing/:productId` | Créer/mettre à jour le costing |
| GET | `/api/workflows` | Workflows de validation |
| PATCH | `/api/workflows/:id/decide` | Valider/rejeter |
| POST | `/api/documents/upload` | Upload document |
| GET | `/health` | Health check |

## Déploiement sur Render

Le fichier `render.yaml` configure le déploiement automatique.
À chaque push sur `main`, Render redéploie automatiquement.

## Accès admin par défaut
- Email : `admin@plm-fashion.com`
- Mot de passe : `Admin1234!`
- ⚠️ **À changer immédiatement en production**
