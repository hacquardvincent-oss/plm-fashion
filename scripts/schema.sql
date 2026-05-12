-- ============================================================
--  PLM Fashion & Maroquinerie — Schéma PostgreSQL complet
--  Version 1.0 | Mai 2026
--  Architecture : on-premise, PostgreSQL 15+
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- recherche full-text fuzzy

-- ============================================================
--  ÉNUMÉRATIONS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'admin', 'directeur_artistique', 'chef_produit',
  'acheteur', 'qualite', 'direction', 'fournisseur'
);

CREATE TYPE product_type AS ENUM ('pret_a_porter', 'maroquinerie', 'accessoire');

CREATE TYPE collection_status AS ENUM (
  'brouillon', 'en_cours', 'validee', 'archivee'
);

CREATE TYPE product_status AS ENUM (
  'concept', 'en_developpement', 'proto_1', 'proto_2',
  'sms', 'valide', 'abandonne', 'archive'
);

CREATE TYPE validation_decision AS ENUM ('approuve', 'rejete', 'en_attente', 'revision');

CREATE TYPE material_type AS ENUM (
  'tissu', 'cuir', 'doublure', 'fil', 'fermeture',
  'bouton', 'zip', 'quincaillerie', 'emballage', 'autre'
);

CREATE TYPE sample_status AS ENUM (
  'commande', 'en_transit', 'recu', 'valide', 'rejete'
);

CREATE TYPE change_type AS ENUM ('ECR', 'ECO');
CREATE TYPE change_status AS ENUM ('ouvert', 'en_cours', 'approuve', 'rejete', 'clos');

CREATE TYPE document_type AS ENUM (
  'fiche_technique', 'patron', 'visuel', 'gabarit',
  'spec_fournisseur', 'rapport_qualite', 'autre'
);

CREATE TYPE sync_direction AS ENUM ('plm_to_erp', 'erp_to_plm', 'bidirectionnel');
CREATE TYPE sync_status AS ENUM ('en_attente', 'en_cours', 'succes', 'erreur');

-- ============================================================
--  1. UTILISATEURS & AUTHENTIFICATION
-- ============================================================

CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  role           user_role NOT NULL DEFAULT 'chef_produit',
  supplier_id    UUID,                        -- FK ajoutée après création suppliers
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,   -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  entity_type VARCHAR(100),            -- 'product', 'collection', etc.
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  2. FOURNISSEURS
-- ============================================================

CREATE TABLE suppliers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             VARCHAR(30) UNIQUE NOT NULL,
  name             VARCHAR(255) NOT NULL,
  country          VARCHAR(100),
  city             VARCHAR(100),
  address          TEXT,
  contact_name     VARCHAR(200),
  contact_email    VARCHAR(255),
  contact_phone    VARCHAR(50),
  currency         CHAR(3) DEFAULT 'EUR',
  payment_terms    VARCHAR(100),              -- ex: '30 jours net'
  lead_time_days   INTEGER,                   -- délai standard en jours
  quality_score    NUMERIC(3,1) CHECK (quality_score BETWEEN 0 AND 10),
  certifications   TEXT[],                    -- ex: ['ISO9001','OEKO-TEX']
  specialties      TEXT[],                    -- ex: ['cuir','tissu','zip']
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  erp_code         VARCHAR(100),              -- code dans Cegid/Sage
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Liaison users ↔ suppliers (accès portail fournisseur)
ALTER TABLE users ADD CONSTRAINT fk_users_supplier
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

CREATE TABLE supplier_evaluations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id   UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  evaluated_by  UUID NOT NULL REFERENCES users(id),
  score         NUMERIC(3,1) NOT NULL CHECK (score BETWEEN 0 AND 10),
  quality       NUMERIC(3,1),
  delay         NUMERIC(3,1),
  communication NUMERIC(3,1),
  comment       TEXT,
  evaluated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  3. COLLECTIONS
-- ============================================================

CREATE TABLE collections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          VARCHAR(20) UNIQUE NOT NULL,   -- ex: 'SS2026', 'AW2025'
  name          VARCHAR(255) NOT NULL,
  season        VARCHAR(50),                   -- 'Printemps-Été', 'Automne-Hiver', 'Capsule'
  year          SMALLINT NOT NULL,
  status        collection_status NOT NULL DEFAULT 'brouillon',
  target_refs   INTEGER,                       -- nombre de références cible
  budget        NUMERIC(12,2),
  description   TEXT,
  brief_url     TEXT,                          -- lien vers brief créatif
  delivery_date DATE,
  showroom_date DATE,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collection_milestones (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id  UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  name           VARCHAR(200) NOT NULL,        -- ex: 'Remise maquettes', 'Proto 1'
  due_date       DATE NOT NULL,
  completed_at   TIMESTAMPTZ,
  responsible_id UUID REFERENCES users(id),
  notes          TEXT
);

-- ============================================================
--  4. MATIÈRES
-- ============================================================

CREATE TABLE materials (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code              VARCHAR(50) UNIQUE NOT NULL,
  name              VARCHAR(255) NOT NULL,
  type              material_type NOT NULL,
  composition       VARCHAR(255),              -- ex: '80% coton 20% polyester'
  width_cm          NUMERIC(6,2),              -- pour les tissus (en cm)
  weight_gsm        NUMERIC(6,2),              -- grammes/m²
  color_reference   VARCHAR(100),              -- référence Pantone/NCS
  color_name        VARCHAR(100),
  unit              VARCHAR(20) DEFAULT 'ml',  -- ml, kg, pièce, etc.
  min_order_qty     NUMERIC(10,2),
  price_per_unit    NUMERIC(10,4),
  currency          CHAR(3) DEFAULT 'EUR',
  supplier_id       UUID REFERENCES suppliers(id),
  supplier_ref      VARCHAR(100),
  lead_time_days    INTEGER,
  is_validated      BOOLEAN NOT NULL DEFAULT FALSE,
  validated_by      UUID REFERENCES users(id),
  validated_at      TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE material_samples (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id  UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  supplier_id  UUID REFERENCES suppliers(id),
  quantity     NUMERIC(10,2),
  unit         VARCHAR(20),
  status       sample_status NOT NULL DEFAULT 'commande',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at  TIMESTAMPTZ,
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  notes        TEXT
);

-- ============================================================
--  5. PRODUITS / FICHES TECHNIQUES
-- ============================================================

CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference        VARCHAR(50) UNIQUE NOT NULL,     -- ex: 'SS26-PAP-001'
  name             VARCHAR(255) NOT NULL,
  type             product_type NOT NULL,
  collection_id    UUID NOT NULL REFERENCES collections(id),
  family           VARCHAR(100),                    -- ex: 'Vestes', 'Sacs à main'
  sub_family       VARCHAR(100),
  status           product_status NOT NULL DEFAULT 'concept',
  gender           VARCHAR(20),                     -- 'femme', 'homme', 'mixte'
  description      TEXT,
  style_notes      TEXT,
  target_retail_price NUMERIC(10,2),
  target_cost      NUMERIC(10,2),                   -- coût cible
  target_margin    NUMERIC(5,2),                    -- marge cible en %
  main_supplier_id UUID REFERENCES suppliers(id),
  erp_article_code VARCHAR(100),                    -- code dans Cegid/Sage
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Variantes (coloris × taille × matière)
CREATE TABLE product_variants (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku            VARCHAR(100) UNIQUE NOT NULL,
  color_name     VARCHAR(100),
  color_ref      VARCHAR(50),                   -- Pantone/NCS
  size           VARCHAR(20),                   -- 'XS','S','M','L','XL' ou '36','38'...
  size_system    VARCHAR(20) DEFAULT 'FR',       -- 'FR','IT','US'
  material_ref   VARCHAR(100),                  -- variante de matière principale
  barcode        VARCHAR(50),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  erp_sku        VARCHAR(100),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tableau de tailles / gradation
CREATE TABLE size_grading (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size         VARCHAR(20) NOT NULL,
  measurement  VARCHAR(100) NOT NULL,   -- ex: 'Tour de poitrine', 'Longueur dos'
  value_cm     NUMERIC(6,2) NOT NULL,
  tolerance    NUMERIC(4,2),            -- tolérance ±
  UNIQUE (product_id, size, measurement)
);

-- Nomenclature matières (BOM)
CREATE TABLE product_bom (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  material_id     UUID NOT NULL REFERENCES materials(id),
  usage_type      VARCHAR(100),          -- ex: 'Corps principal', 'Doublure', 'Fermeture'
  quantity        NUMERIC(10,4) NOT NULL,
  unit            VARCHAR(20) NOT NULL,   -- 'ml', 'kg', 'pièce'
  waste_factor    NUMERIC(5,4) DEFAULT 0.05, -- 5% de perte par défaut
  notes           TEXT,
  UNIQUE (product_id, material_id, usage_type)
);

-- ============================================================
--  6. COSTING
-- ============================================================

CREATE TABLE product_costings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version             SMALLINT NOT NULL DEFAULT 1,
  is_current          BOOLEAN NOT NULL DEFAULT TRUE,
  -- Matières
  materials_cost      NUMERIC(10,4) DEFAULT 0,
  -- Façon / CMT (Cut, Make, Trim)
  cmt_cost            NUMERIC(10,4) DEFAULT 0,
  -- Accessoires (étiquettes, hangers, emballage)
  accessories_cost    NUMERIC(10,4) DEFAULT 0,
  -- Transport & logistique
  transport_cost      NUMERIC(10,4) DEFAULT 0,
  -- Droits de douane
  customs_cost        NUMERIC(10,4) DEFAULT 0,
  -- Coût total calculé (mis à jour par trigger)
  total_cost          NUMERIC(10,4) DEFAULT 0,
  currency            CHAR(3) DEFAULT 'EUR',
  -- Prix de vente et marges
  wholesale_price     NUMERIC(10,2),              -- prix gros
  retail_price        NUMERIC(10,2),              -- prix détail
  gross_margin_pct    NUMERIC(6,3) DEFAULT 0,
  coefficient         NUMERIC(6,3) DEFAULT 0,
  notes               TEXT,
  created_by          UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, version)
);

-- Détail des lignes de costing
CREATE TABLE costing_lines (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  costing_id     UUID NOT NULL REFERENCES product_costings(id) ON DELETE CASCADE,
  category       VARCHAR(100) NOT NULL,       -- 'matiere', 'cmt', 'accessoire', 'transport'
  label          VARCHAR(255) NOT NULL,
  quantity       NUMERIC(10,4),
  unit_price     NUMERIC(10,4),
  amount         NUMERIC(10,4) NOT NULL,
  currency       CHAR(3) DEFAULT 'EUR',
  supplier_id    UUID REFERENCES suppliers(id),
  notes          TEXT
);

-- Trigger : recalcul automatique de total_cost, gross_margin_pct et coefficient
CREATE OR REPLACE FUNCTION calc_costing_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost := COALESCE(NEW.materials_cost, 0)
                  + COALESCE(NEW.cmt_cost, 0)
                  + COALESCE(NEW.accessories_cost, 0)
                  + COALESCE(NEW.transport_cost, 0)
                  + COALESCE(NEW.customs_cost, 0);

  IF COALESCE(NEW.retail_price, 0) > 0 THEN
    NEW.gross_margin_pct := ROUND(
      ((NEW.retail_price - NEW.total_cost) / NEW.retail_price) * 100, 3);
  ELSE
    NEW.gross_margin_pct := 0;
  END IF;

  IF NEW.total_cost > 0 THEN
    NEW.coefficient := ROUND(COALESCE(NEW.retail_price, 0) / NEW.total_cost, 3);
  ELSE
    NEW.coefficient := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_costings_calc
  BEFORE INSERT OR UPDATE ON product_costings
  FOR EACH ROW EXECUTE FUNCTION calc_costing_fields();

-- ============================================================
--  7. WORKFLOWS DE VALIDATION
-- ============================================================

CREATE TABLE validation_workflows (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stage          product_status NOT NULL,      -- étape du cycle de vie
  requested_by   UUID NOT NULL REFERENCES users(id),
  requested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date       TIMESTAMPTZ,
  decision       validation_decision NOT NULL DEFAULT 'en_attente',
  decided_by     UUID REFERENCES users(id),
  decided_at     TIMESTAMPTZ,
  comments       TEXT,
  next_stage     product_status                -- étape suivante si approuvé
);

CREATE TABLE validation_comments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID NOT NULL REFERENCES validation_workflows(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  comment         TEXT NOT NULL,
  is_blocking     BOOLEAN DEFAULT FALSE,       -- commentaire bloquant ou informatif
  zone            VARCHAR(100),                -- zone du produit concernée (ex: 'col', 'fermeture')
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  8. CHANGE MANAGEMENT (ECR / ECO)
-- ============================================================

CREATE TABLE change_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type           change_type NOT NULL DEFAULT 'ECR',
  reference      VARCHAR(50) UNIQUE NOT NULL,  -- ex: 'ECR-2026-0042'
  product_id     UUID NOT NULL REFERENCES products(id),
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  reason         VARCHAR(255),                 -- ex: 'Qualité', 'Coût', 'Design'
  impact         TEXT,                         -- impact estimé
  status         change_status NOT NULL DEFAULT 'ouvert',
  priority       SMALLINT DEFAULT 2 CHECK (priority BETWEEN 1 AND 3), -- 1=urgent
  requested_by   UUID NOT NULL REFERENCES users(id),
  assigned_to    UUID REFERENCES users(id),
  approved_by    UUID REFERENCES users(id),
  approved_at    TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  due_date       DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  9. GESTION DOCUMENTAIRE
-- ============================================================

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type     VARCHAR(50) NOT NULL,         -- 'product', 'collection', 'material', 'supplier'
  entity_id       UUID NOT NULL,
  type            document_type NOT NULL,
  name            VARCHAR(255) NOT NULL,
  filename        VARCHAR(255) NOT NULL,
  storage_path    TEXT NOT NULL,                -- chemin MinIO : bucket/path/file
  mime_type       VARCHAR(100),
  file_size_bytes BIGINT,
  version         SMALLINT NOT NULL DEFAULT 1,
  is_current      BOOLEAN NOT NULL DEFAULT TRUE,
  is_public       BOOLEAN NOT NULL DEFAULT FALSE, -- visible fournisseur ?
  checksum        VARCHAR(64),                  -- SHA-256
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT
);

CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_current ON documents(entity_type, entity_id) WHERE is_current = TRUE;

-- ============================================================
--  10. PORTAIL FOURNISSEURS — MESSAGERIE
-- ============================================================

CREATE TABLE supplier_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type   VARCHAR(50) NOT NULL,    -- 'product', 'material', 'sample'
  entity_id     UUID NOT NULL,
  thread_id     UUID,                    -- regroupement de messages
  from_user_id  UUID NOT NULL REFERENCES users(id),
  to_supplier_id UUID REFERENCES suppliers(id),
  subject       VARCHAR(255),
  body          TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT FALSE,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  11. INTÉGRATION ERP
-- ============================================================

CREATE TABLE erp_sync_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type     VARCHAR(50) NOT NULL,   -- 'product', 'supplier', 'price'
  entity_id       UUID,
  direction       sync_direction NOT NULL,
  status          sync_status NOT NULL DEFAULT 'en_attente',
  erp_system      VARCHAR(50) NOT NULL,   -- 'cegid', 'sage'
  payload         JSONB,                  -- données envoyées/reçues
  response        JSONB,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE erp_mappings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type   VARCHAR(50) NOT NULL,
  plm_id        UUID NOT NULL,
  erp_system    VARCHAR(50) NOT NULL,
  erp_code      VARCHAR(100) NOT NULL,
  last_synced   TIMESTAMPTZ,
  UNIQUE (entity_type, plm_id, erp_system)
);

-- ============================================================
--  12. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(100) NOT NULL,      -- 'validation_request', 'proto_approved', etc.
  title        VARCHAR(255) NOT NULL,
  body         TEXT,
  entity_type  VARCHAR(50),
  entity_id    UUID,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- ============================================================
--  INDEXES PRINCIPAUX
-- ============================================================

CREATE INDEX idx_products_collection   ON products(collection_id);
CREATE INDEX idx_products_status       ON products(status);
CREATE INDEX idx_products_reference    ON products(reference);
CREATE INDEX idx_products_erp          ON products(erp_article_code) WHERE erp_article_code IS NOT NULL;

CREATE INDEX idx_variants_product      ON product_variants(product_id);
CREATE INDEX idx_bom_product           ON product_bom(product_id);
CREATE INDEX idx_bom_material          ON product_bom(material_id);

CREATE INDEX idx_workflows_product     ON validation_workflows(product_id);
CREATE INDEX idx_workflows_pending     ON validation_workflows(product_id) WHERE decision = 'en_attente';

CREATE INDEX idx_ecr_product           ON change_requests(product_id);
CREATE INDEX idx_ecr_status            ON change_requests(status);

CREATE INDEX idx_materials_supplier    ON materials(supplier_id);
CREATE INDEX idx_materials_name_trgm   ON materials USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_name_trgm    ON products USING gin(name gin_trgm_ops);

CREATE INDEX idx_audit_entity          ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user            ON audit_logs(user_id);

-- ============================================================
--  TRIGGER : updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','suppliers','collections','materials',
    'products','change_requests'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
--  DONNÉES DE RÉFÉRENCE INITIALES
-- ============================================================

INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
  ('admin@plm.local', '$2b$12$placeholder_change_me', 'Admin', 'PLM', 'admin');

-- ============================================================
--  FIN DU SCHÉMA
-- ============================================================
